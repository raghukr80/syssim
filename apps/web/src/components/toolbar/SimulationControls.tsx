import { useDiagramStore } from '../../stores/diagramStore'
import { Play, Pause, Square } from 'lucide-react'
import { simulationController } from '../../wasm/simulationController'

export function SimulationControls() {
  const store = useDiagramStore()
  const { simState, speedMultiplier } = store

  const handlePlay = async () => {
    const currentState = useDiagramStore.getState()
    if (currentState.simState === 'paused') {
      simulationController.resume()
      useDiagramStore.getState().setSimState('running')
      return
    }

    // Start new simulation
    useDiagramStore.getState().clearEvents()
    const diagram = {
      nodes: currentState.nodes,
      edges: currentState.edges,
    }

    if (currentState.nodes.length === 0) {
      console.log('[Sim] No nodes on canvas — add components first')
      return
    }

    console.log('[Sim] Starting simulation with', currentState.nodes.length, 'nodes')

    // Use JS simulation (WASM data format may not match)
    store.setSimState('running')
    startJSSimulation()
  }

  const handlePause = () => {
    simulationController.pause()
    store.setSimState('paused')
  }

  const handleStop = () => {
    simulationController.stop()
    if ((window as any).__simInterval) {
      clearInterval((window as any).__simInterval)
      ;(window as any).__simInterval = null
    }
    const currentState = useDiagramStore.getState()
    // Generate report before resetting
    currentState.generateReport()
    currentState.setSimState('stopped')
    currentState.nodes.forEach(n => currentState.updateNodeStatus(n.id, 'idle'))
    currentState.setSystemMetrics({
      totalRps: 0,
      systemP99: 0,
      errorRate: 0,
      bottleneckCount: 0,
      latencyHistory: [],
      componentMetrics: {},
    })
  }

  const startWASMPolling = () => {
    const interval = setInterval(() => {
      const state = useDiagramStore.getState()
      if (state.simState !== 'running') {
        clearInterval(interval)
        return
      }
      try {
        const result = simulationController.step()
        if (result) {
          const sm = result.systemMetrics
          console.log('[WASM Poll] totalRps:', sm?.totalRps, 'p99:', sm?.p99, 'errorRate:', sm?.errorRate, 'componentMetrics keys:', Object.keys(sm?.componentMetrics || {}).length)
          useDiagramStore.getState().setSystemMetrics({
            totalRps: sm?.totalRps || 0,
            systemP99: sm?.p99 || 0,
            errorRate: sm?.errorRate || 0,
            bottleneckCount: sm?.bottleneckCount || 0,
            latencyHistory: sm?.history || [],
            componentMetrics: sm?.componentMetrics || {},
          })
          // Update per-node metrics and generate events
          if (sm?.componentMetrics) {
            const store = useDiagramStore.getState()
            const tick = store.simTick

            Object.entries(sm.componentMetrics).forEach(([nodeId, metrics]: [string, any]) => {
              const currentRps = metrics.current_rps || 0
              const p99Latency = metrics.p99_latency_ms || 0
              const errorRate = metrics.error_rate || 0
              const utilization = metrics.utilization || 0

              store.updateNodeMetrics(nodeId, {
                currentRps,
                avgLatency: metrics.avg_latency_ms || 0,
                p99Latency,
                errorRate,
                queueDepth: metrics.queue_depth || 0,
                utilization,
              })

              if (errorRate > 0.1) store.updateNodeStatus(nodeId, 'failed')
              else if (utilization > 0.8) store.updateNodeStatus(nodeId, 'degraded')
              else store.updateNodeStatus(nodeId, 'running')

              // ── Event generation and stats tracking ──
              const node = store.nodes.find(n => n.id === nodeId)
              if (node) {
                const config = node.data.config
                const prevNs = store.nodeEventStats[nodeId] || {
                  totalRps: 0, rpsSamples: 0, totalLatency: 0, latencySamples: 0,
                  totalUtilization: 0, utilSamples: 0, peakErrorRate: 0, errorRateSamples: 0,
                  statusDurations: {},
                }

                const newNs = {
                  totalRps: prevNs.totalRps + currentRps,
                  rpsSamples: prevNs.rpsSamples + 1,
                  totalLatency: prevNs.totalLatency + p99Latency,
                  latencySamples: prevNs.latencySamples + 1,
                  totalUtilization: prevNs.totalUtilization + utilization,
                  utilSamples: prevNs.utilSamples + 1,
                  peakErrorRate: Math.max(prevNs.peakErrorRate, errorRate),
                  errorRateSamples: prevNs.errorRateSamples + 1,
                  statusDurations: { ...prevNs.statusDurations, [node.data.status]: (prevNs.statusDurations[node.data.status] || 0) + 1 },
                }
                store.nodeEventStats[nodeId] = newNs

                // Generate events (throttled: max 1 per node per 3 ticks)
                const recentEvents = store.events.filter(e => e.nodeId === nodeId && tick - e.tick < 3)
                if (recentEvents.length === 0) {
                  if (p99Latency > config.latencyP99 * 2.5) {
                    store.addEvent({
                      nodeId,
                      nodeName: node.data.label,
                      type: 'high_latency',
                      severity: p99Latency > config.latencyP99 * 4 ? 'critical' : 'warning',
                      message: `${node.data.label} P99 latency spiked to ${p99Latency.toFixed(0)}ms`,
                      details: `${node.data.label} responding ${(p99Latency / config.latencyP99).toFixed(1)}× slower than baseline (${config.latencyP99}ms)`,
                      metric: { key: 'p99Latency', value: p99Latency, threshold: config.latencyP99 },
                    })
                  } else if (errorRate > 0.08) {
                    store.addEvent({
                      nodeId,
                      nodeName: node.data.label,
                      type: 'high_error_rate',
                      severity: errorRate > 0.2 ? 'critical' : 'warning',
                      message: `${node.data.label} error rate at ${(errorRate * 100).toFixed(1)}%`,
                      details: `${node.data.label} is experiencing elevated error rates (${(errorRate * 100).toFixed(1)}% vs ${(config.failureRate * 100).toFixed(1)}% baseline)`,
                      metric: { key: 'errorRate', value: errorRate, threshold: config.failureRate },
                    })
                  } else if (utilization > 0.85) {
                    store.addEvent({
                      nodeId,
                      nodeName: node.data.label,
                      type: utilization > 0.95 ? 'utilization_spike' : 'high_utilization',
                      severity: utilization > 0.95 ? 'critical' : 'warning',
                      message: `${node.data.label} utilization at ${(utilization * 100).toFixed(0)}%`,
                      details: `${node.data.label} saturated at ${currentRps} RPS against ${config.maxRps} RPS capacity (${(utilization * 100).toFixed(0)}% load)`,
                      metric: { key: 'utilization', value: utilization, threshold: 0.8 },
                    })
                  } else if (currentRps > config.maxRps * 1.1) {
                    store.addEvent({
                      nodeId,
                      nodeName: node.data.label,
                      type: 'rps_overflow',
                      severity: currentRps > config.maxRps * 1.5 ? 'critical' : 'warning',
                      message: `${node.data.label} receiving ${currentRps} RPS but capacity is ${config.maxRps} RPS`,
                      details: `${node.data.label} overflow: +${((currentRps / config.maxRps - 1) * 100).toFixed(0)}% over capacity`,
                      metric: { key: 'rps', value: currentRps, threshold: config.maxRps },
                    })
                  }
                }
              }
            })
          }

          // Increment tick
          store.incrementTick()
        }
      } catch (e) {
        console.warn('WASM step failed:', e)
        clearInterval(interval)
      }
    }, 500)
    ;(window as any).__simInterval = interval
  }

  // Simple JS simulation fallback (when WASM is not yet built)
  const startJSSimulation = () => {
    let tickCount = 0
    const interval = setInterval(() => {
      const store = useDiagramStore.getState()
      if (store.simState !== 'running') {
        clearInterval(interval)
        return
      }

      const nodes = store.nodes
      if (nodes.length === 0) {
        console.log('[JS Sim] No nodes, skipping tick')
        return
      }

      tickCount++
      if (tickCount === 1) console.log('[JS Sim] First tick with', nodes.length, 'nodes')
      const activeChaos = store.activeChaos
      const trafficMult = store.trafficMultiplier
      const metrics: Record<string, any> = {}
      let totalRps = 0
      let maxP99 = 0
      let totalErrors = 0
      let bottleneckCount = 0

      nodes.forEach(node => {
        const config = node.data.config
        const loadFactor = Math.random() * 0.5 + 0.3
        let currentRps = Math.round(config.maxRps * loadFactor * (store.speedMultiplier * 0.1 + 0.5) * trafficMult)
        let utilization = loadFactor * (0.7 + Math.random() * 0.3)
        let errorRate = config.failureRate * (1 + Math.random() * (utilization > 0.8 ? 5 : 1))
        let p99 = config.latencyP99 * (1 + utilization * (0.5 + Math.random()))

        // Apply chaos effects targeting this node
        const nodeChaos = activeChaos.filter(c => c.targetNodeId === node.id)
        for (const chaos of nodeChaos) {
          const s = chaos.scenario
          if (s.latencyInjection) {
            p99 += s.latencyInjection.delayMs * (1 + utilization)
          }
          if (s.failureRate !== undefined) {
            errorRate = Math.min(errorRate + s.failureRate, 1)
          }
          if (s.cpuSpike) {
            p99 *= s.cpuSpike
          }
          if (s.memoryPressure) {
            currentRps = Math.round(currentRps * s.memoryPressure)
            utilization = Math.min(utilization / s.memoryPressure, 1)
          }
          if (s.bandwidthLimitMbps) {
            const bwFactor = Math.min(1, s.bandwidthLimitMbps / 100)
            currentRps = Math.round(currentRps * bwFactor)
          }
        }

        // ── Component-specific simulation behavior ──

        // Cache: high hit ratio reduces effective latency and error rate
        if (config.cacheHitRatio !== undefined) {
          const hitRatio = config.cacheHitRatio
          // Cache hits are much faster and rarely error
          p99 = p99 * (1 - hitRatio * 0.8)  // Up to 80% latency reduction
          errorRate = errorRate * (1 - hitRatio * 0.5)  // Up to 50% error reduction
          // Cache memory pressure
          if (config.maxMemoryMb !== undefined && config.maxMemoryMb < 512) {
            utilization = Math.min(utilization * 1.3, 1)  // Small cache = higher utilization
            errorRate = Math.min(errorRate * 1.5, 1)
          }
        }

        // Database: replication and consistency affect latency/errors
        if (config.replicationFactor !== undefined) {
          const replicas = config.replicationFactor
          // More replicas = better read latency but write latency increases with strong consistency
          if (config.writeConsistency === 'strong') {
            p99 = p99 * (1 + (replicas - 1) * 0.15)  // Strong consistency adds latency per replica
            errorRate = errorRate * 0.7  // But fewer errors due to redundancy
          } else if (config.writeConsistency === 'eventual') {
            p99 = p99 * (1 + (replicas - 1) * 0.05)  // Eventual consistency is faster
            errorRate = errorRate * 1.1  // Slightly more errors possible
          }
          // Read replicas help with read throughput
          if (config.readReplicas !== undefined && config.readReplicas > 0) {
            const readScale = Math.min(config.readReplicas, 5)
            currentRps = Math.round(currentRps * (1 + readScale * 0.3))
            utilization = utilization * (1 - readScale * 0.05)
          }
          // Storage and IOPS affect performance
          if (config.iops !== undefined && config.iops < 1000) {
            p99 = p99 * (1 + (1000 - config.iops) / 2000)  // Low IOPS = higher latency
          }
        }

        // Load Balancer: algorithm and health check affect distribution
        if (config.algorithm !== undefined) {
          if (config.algorithm === 'least-connections') {
            utilization = utilization * 0.9  // Better distribution
            p99 = p99 * 0.95
          } else if (config.algorithm === 'weighted') {
            // Weighted can be slightly less efficient
            utilization = utilization * 1.05
          }
          // SSL termination adds slight latency
          if (config.sslTermination) {
            p99 = p99 * 1.05
          }
          // Health check interval affects failure detection
          if (config.healthCheckInterval !== undefined && config.healthCheckInterval > 30) {
            errorRate = errorRate * 1.2  // Slow health checks = more errors routed to bad nodes
          }
        }

        // Compute: auto-scaling affects utilization
        if (config.autoScale !== undefined) {
          if (config.autoScale) {
            // Auto-scaling keeps utilization in check
            const minInst = config.minInstances || 2
            const maxInst = config.maxInstances || 10
            const scaleFactor = Math.min(maxInst / Math.max(minInst, 1), 5)
            if (utilization > 0.7) {
              // Auto-scale kicks in
              utilization = utilization * (0.6 + 0.4 / scaleFactor)
              currentRps = Math.round(currentRps * (1 + (scaleFactor - 1) * 0.2))
            }
          }
          // CPU/Memory affect performance
          if (config.cpuCores !== undefined && config.cpuCores < 2) {
            p99 = p99 * (2 / Math.max(config.cpuCores, 0.5))
          }
          if (config.memoryGb !== undefined && config.memoryGb < 4) {
            utilization = Math.min(utilization * (4 / Math.max(config.memoryGb, 1)), 1)
          }
        }

        // Serverless: cold start and concurrency affect latency
        if (config.coldStartMs !== undefined) {
          // Cold starts add latency spikes
          if (Math.random() < 0.05) {  // 5% chance of cold start
            p99 = p99 + config.coldStartMs
          }
          // Concurrency limits
          if (config.concurrency !== undefined && config.concurrency < 100) {
            if (currentRps > config.concurrency * 10) {
              errorRate = Math.min(errorRate * 2, 1)  // Throttling
              utilization = Math.min(utilization * 1.5, 1)
            }
          }
          // Timeout affects error rate
          if (config.timeoutMs !== undefined && config.timeoutMs < 5000) {
            if (p99 > config.timeoutMs * 0.8) {
              errorRate = Math.min(errorRate * 1.5, 1)  // Requests timing out
            }
          }
        }

        // Queue/Messaging: retention and delivery guarantee affect behavior
        if (config.messageRetentionHours !== undefined) {
          if (config.deliveryGuarantee === 'exactly-once') {
            p99 = p99 * 1.3  // Exactly-once is slower
            errorRate = errorRate * 0.8  // But more reliable
          } else if (config.deliveryGuarantee === 'at-most-once') {
            p99 = p99 * 0.8  // Faster
            errorRate = errorRate * 1.3  // But less reliable
          }
          // Consumer count affects throughput
          if (config.consumerCount !== undefined && config.consumerCount > 0) {
            currentRps = Math.round(currentRps * (1 + config.consumerCount * 0.1))
          }
        }

        // CDN: edge locations and cache TTL affect performance
        if (config.edgeLocations !== undefined) {
          const edgeFactor = Math.min(config.edgeLocations / 100, 3)
          p99 = p99 * (1 / (1 + edgeFactor * 0.2))  // More edges = lower latency
          if (config.originShield) {
            p99 = p99 * 0.9  // Origin shield helps
            errorRate = errorRate * 0.85
          }
        }

        // Storage: storage class affects latency
        if (config.storageClass !== undefined) {
          if (config.storageClass === 'infrequent') {
            p99 = p99 * 1.5
            errorRate = errorRate * 1.1
          } else if (config.storageClass === 'archive' || config.storageClass === 'glacier') {
            p99 = p99 * 3
            currentRps = Math.round(currentRps * 0.3)  // Much slower
          }
        }

        // External/Third-party: rate limiting and circuit breaker
        if (config.rateLimitRps !== undefined) {
          if (currentRps > config.rateLimitRps) {
            errorRate = Math.min(errorRate + (currentRps - config.rateLimitRps) / currentRps, 1)
            currentRps = Math.min(currentRps, config.rateLimitRps)
          }
        }
        if (config.circuitBreaker && errorRate > 0.1) {
          // Circuit breaker trips — stop sending traffic temporarily
          currentRps = Math.round(currentRps * 0.2)
          errorRate = Math.min(errorRate * 0.5, 1)
        }
        if (config.retryCount !== undefined && config.retryCount > 0) {
          // Retries increase effective RPS but also help with errors
          currentRps = Math.round(currentRps * (1 + config.retryCount * 0.05))
          errorRate = errorRate * Math.pow(0.7, config.retryCount)  // Each retry reduces errors
        }

        metrics[node.id] = {
          currentRps,
          avgLatency: config.latencyP50 * (1 + utilization * 0.3),
          p99Latency: p99,
          errorRate: Math.min(errorRate, 1),
          queueDepth: Math.round(utilization * 100),
          utilization: Math.min(utilization, 1),
        }

        totalRps += currentRps
        maxP99 = Math.max(maxP99, p99)
        totalErrors += errorRate
        if (utilization > 0.8) bottleneckCount++

        // ── Event generation and stats tracking ──
        const prevNs = useDiagramStore.getState().nodeEventStats[node.id] || {
          totalRps: 0, rpsSamples: 0, totalLatency: 0, latencySamples: 0,
          totalUtilization: 0, utilSamples: 0, peakErrorRate: 0, errorRateSamples: 0,
          statusDurations: {},
        }
        const prevMetrics = node.data.metrics
        const tick = useDiagramStore.getState().simTick

        // Track stats
        const newNs = {
          totalRps: prevNs.totalRps + currentRps,
          rpsSamples: prevNs.rpsSamples + 1,
          totalLatency: prevNs.totalLatency + p99,
          latencySamples: prevNs.latencySamples + 1,
          totalUtilization: prevNs.totalUtilization + utilization,
          utilSamples: prevNs.utilSamples + 1,
          peakErrorRate: Math.max(prevNs.peakErrorRate, errorRate),
          errorRateSamples: prevNs.errorRateSamples + 1,
          statusDurations: { ...prevNs.statusDurations, [node.data.status]: (prevNs.statusDurations[node.data.status] || 0) + 1 },
        }

        // Generate events based on conditions (throttled: max 1 event per node per 3 ticks)
        const storeRef = useDiagramStore.getState()
        const recentEvents = storeRef.events.filter(e => e.nodeId === node.id && tick - e.tick < 3)
        if (recentEvents.length === 0) {
          // High latency detection
          if (p99 > config.latencyP99 * 2.5) {
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: 'high_latency',
              severity: p99 > config.latencyP99 * 4 ? 'critical' : 'warning',
              message: `${node.data.label} P99 latency spiked to ${p99.toFixed(0)}ms`,
              details: `${node.data.label} responding ${(p99 / config.latencyP99).toFixed(1)}× slower than baseline (${config.latencyP99}ms)`,
              metric: { key: 'p99Latency', value: p99, threshold: config.latencyP99 },
            })
          }
          // High error rate
          else if (errorRate > 0.08) {
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: 'high_error_rate',
              severity: errorRate > 0.2 ? 'critical' : 'warning',
              message: `${node.data.label} error rate at ${(errorRate * 100).toFixed(1)}%`,
              details: `${node.data.label} is experiencing elevated error rates (${(errorRate * 100).toFixed(1)}% vs ${(config.failureRate * 100).toFixed(1)}% baseline)`,
              metric: { key: 'errorRate', value: errorRate, threshold: config.failureRate },
            })
          }
          // High utilization / overload
          else if (utilization > 0.85) {
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: utilization > 0.95 ? 'utilization_spike' : 'high_utilization',
              severity: utilization > 0.95 ? 'critical' : 'warning',
              message: `${node.data.label} utilization at ${(utilization * 100).toFixed(0)}%`,
              details: `${node.data.label} saturated at ${currentRps} RPS against ${config.maxRps} RPS capacity (${(utilization * 100).toFixed(0)}% load)`,
              metric: { key: 'utilization', value: utilization, threshold: 0.8 },
            })
          }
          // RPS overflow
          else if (currentRps > config.maxRps * 1.1) {
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: 'rps_overflow',
              severity: currentRps > config.maxRps * 1.5 ? 'critical' : 'warning',
              message: `${node.data.label} receiving ${currentRps} RPS but capacity is ${config.maxRps} RPS`,
              details: `${node.data.label} overflow: +${((currentRps / config.maxRps - 1) * 100).toFixed(0)}% over capacity`,
              metric: { key: 'rps', value: currentRps, threshold: config.maxRps },
            })
          }
          // SPOF detection — single instance with no autoscale
          else if (!config.autoScale && (config.minInstances || 1) <= 1) {
            const isCompute = ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql'].includes(node.data.componentType)
            if (isCompute) {
              storeRef.addEvent({
                nodeId: node.id,
                nodeName: node.data.label,
                type: 'spof_detected',
                severity: 'warning',
                message: `${node.data.label} is a single point of failure`,
                details: `${node.data.label} runs a single instance with no autoscaling. A failure here will break the entire request path.`,
              })
            }
          }
          // Database with no replicas
          else if (node.data.componentType === 'database' && (config.replicationFactor || 1) <= 1) {
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: 'spof_detected',
              severity: 'warning',
              message: `${node.data.label} has no replicas`,
              details: `Database running with replicationFactor=1. No read replicas and no failover — a single failure causes full downtime.`,
            })
          }
          // Connection pool exhaustion
          else if (config.connectionLimit && currentRps > 0) {
            const connUsage = currentRps / config.connectionLimit
            if (connUsage > 0.9) {
              storeRef.addEvent({
                nodeId: node.id,
                nodeName: node.data.label,
                type: 'connection_pool_full',
                severity: connUsage > 0.98 ? 'critical' : 'warning',
                message: `${node.data.label} connection pool at ${(connUsage * 100).toFixed(0)}% capacity`,
                details: `Connection pool near exhaustion: ${currentRps} active connections against limit of ${config.connectionLimit}. New requests may be queued or rejected.`,
              })
            }
          }
          // Memory pressure
          else if (config.memoryGb && config.memoryGb < 4) {
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: 'memory_pressure',
              severity: config.memoryGb < 2 ? 'critical' : 'warning',
              message: `${node.data.label} low memory (${config.memoryGb}GB)`,
              details: `Component running on only ${config.memoryGb}GB RAM. Under load this risks OOM kills and degraded performance.`,
            })
          }
          // Queue depth (for queues/messaging)
          else if (config.messageRetentionHours !== undefined && (metrics[node.id]?.queueDepth || 0) > 50) {
            const qd = metrics[node.id]?.queueDepth || 0
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: 'consumer_lag',
              severity: qd > 80 ? 'critical' : 'warning',
              message: `${node.data.label} queue depth at ${qd}`,
              details: `Message queue depth growing: ${qd} pending. Consumers may be falling behind — consider adding consumers or partitioning.`,
            })
          }
          // Node degraded status
          else if (node.data.status === 'degraded') {
            storeRef.addEvent({
              nodeId: node.id,
              nodeName: node.data.label,
              type: 'node_degraded',
              severity: 'warning',
              message: `${node.data.label} is degraded`,
              details: `${node.data.label} operating at degraded capacity. Monitor closely and consider scaling or replacing.`,
            })
          }
        }

        // Update node event stats in store
        useDiagramStore.getState().nodeEventStats[node.id] = newNs

        if (errorRate > 0.1) store.updateNodeStatus(node.id, 'failed')
        else if (utilization > 0.8) store.updateNodeStatus(node.id, 'degraded')
        else store.updateNodeStatus(node.id, 'running')
      })

      // ── Cascading failure detection ──
      const edges = store.edges
      const currentTick = store.simTick
      for (const node of nodes) {
        if (node.data.status === 'failed') {
          // Find upstream nodes and check if they're now affected
          const upstreamEdges = edges.filter(e => e.target === node.id)
          for (const edge of upstreamEdges) {
            const upstreamNode = nodes.find(n => n.id === edge.source)
            if (upstreamNode && upstreamNode.data.status !== 'failed') {
              const recentCascade = store.events.filter(e => e.nodeId === upstreamNode.id && e.type === 'cascading_failure' && currentTick - e.tick < 5)
              if (recentCascade.length === 0) {
                store.addEvent({
                  nodeId: upstreamNode.id,
                  nodeName: upstreamNode.data.label,
                  type: 'cascading_failure',
                  severity: 'critical',
                  message: `${upstreamNode.data.label} affected by ${node.data.label} failure`,
                  details: `Downstream dependency ${node.data.label} has failed. ${upstreamNode.data.label} may be unable to complete requests that depend on it.`,
                })
              }
            }
          }
        }
      }

      const prevHistory = store.systemMetrics.latencyHistory
      const newSample = {
        timestamp: Date.now(),
        p50: maxP99 * 0.3,
        p95: maxP99 * 0.8,
        p99: maxP99,
      }
      const latencyHistory = [...prevHistory, newSample].slice(-60)

      store.setSystemMetrics({
        totalRps,
        systemP99: maxP99,
        errorRate: nodes.length > 0 ? totalErrors / nodes.length : 0,
        bottleneckCount,
        latencyHistory,
        componentMetrics: metrics,
      })

      Object.entries(metrics).forEach(([nodeId, m]) => {
        store.updateNodeMetrics(nodeId, m)
      })

      // Increment simulation tick
      store.incrementTick()
    }, 500 / store.speedMultiplier)

    ;(window as any).__simInterval = interval
  }

  return (
    <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 shadow-xl">
      {simState === 'running' ? (
        <button onClick={handlePause} className="p-1.5 rounded hover:bg-surface-hover text-warning transition-colors" title="Pause">
          <Pause className="w-4 h-4" />
        </button>
      ) : (
        <button onClick={handlePlay} className="p-1.5 rounded hover:bg-surface-hover text-success transition-colors" title="Play">
          <Play className="w-4 h-4" />
        </button>
      )}

      <button onClick={handleStop} className="p-1.5 rounded hover:bg-surface-hover text-error transition-colors" title="Stop">
        <Square className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Speed control */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-text-dim uppercase tracking-wider">Speed</span>
        <select
          value={speedMultiplier}
          onChange={(e) => store.setSpeedMultiplier(Number(e.target.value))}
          className="bg-bg border border-border rounded text-[10px] text-text px-1 py-0.5 outline-none cursor-pointer"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      </div>

      {/* Traffic control */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-text-dim uppercase tracking-wider">Traffic</span>
        <select
          value={store.trafficMultiplier}
          onChange={(e) => store.setTrafficMultiplier(Number(e.target.value))}
          className="bg-bg border border-border rounded text-[10px] text-text px-1 py-0.5 outline-none cursor-pointer"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={3}>3x</option>
          <option value={5}>5x</option>
        </select>
      </div>

      {simState !== 'idle' && simState !== 'stopped' && (
        <span className="text-[10px] text-text-dim px-2">
          {simState === 'running' ? 'RUNNING' : 'PAUSED'}
        </span>
      )}
    </div>
  )
}
