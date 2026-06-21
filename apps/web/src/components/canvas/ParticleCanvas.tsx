import { useEffect, useRef } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'

interface Particle {
  edgeId: string
  progress: number
  speed: number
  color: string
  size: number
  alpha: number
  trail: { x: number; y: number }[]
  spawnTime: number
}

const COLORS: Record<string, string> = {
  running: '#22c55e',
  degraded: '#eab308',
  failed: '#ef4444',
  idle: '#6366f1',
}

function getNodeStatusColor(nodeId: string, store: any): string {
  const node = store.nodes.find((n: any) => n.id === nodeId)
  if (!node) return COLORS.idle
  return COLORS[node.data.status] ?? COLORS.idle
}

function getSourceRps(nodeId: string, store: any): number {
  const node = store.nodes.find((n: any) => n.id === nodeId)
  return node?.data.metrics?.currentRps ?? 0
}

// Read the current transform from React Flow's viewport element
function getViewportTransform() {
  const pane = document.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!pane) return { x: 0, y: 0, zoom: 1 }
  const transform = window.getComputedStyle(pane).transform
  if (!transform || transform === 'none') return { x: 0, y: 0, zoom: 1 }
  const matrix = new DOMMatrix(transform)
  return { x: matrix.m41, y: matrix.m42, zoom: matrix.a }
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const storeRef = useRef(useDiagramStore.getState())

  // Keep store ref up to date
  useEffect(() => {
    const unsub = useDiagramStore.subscribe((state) => {
      storeRef.current = state
    })
    return unsub
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const PATH_SAMPLES = 40
    let lastTime = performance.now()

    const render = (now: number) => {
      const dt = Math.min(now - lastTime, 50)
      lastTime = now

      // Resize canvas
      const container = canvas.parentElement
      if (container) {
        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        const w = Math.round(rect.width * dpr)
        const h = Math.round(rect.height * dpr)
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
          canvas.style.width = `${rect.width}px`
          canvas.style.height = `${rect.height}px`
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const state = storeRef.current

      if (state.simState !== 'running') {
        particlesRef.current = []
        animFrameRef.current = requestAnimationFrame(render)
        return
      }

      // Read all edges from the store
      const edges = state.edges
      const particles = particlesRef.current
      const { x: tx, y: ty, zoom: tZoom } = getViewportTransform()

      // Spawn particles proportional to edge throughput
      for (const edge of edges) {
        const rps = getSourceRps(edge.source, state)
        if (rps <= 0) continue

        const existing = particles.filter(p => p.edgeId === edge.id).length
        const target = Math.min(Math.ceil(rps / 300), 12)

        if (existing < target) {
          const toSpawn = Math.min(target - existing, 1)
          const color = getNodeStatusColor(edge.target, state)
          for (let i = 0; i < toSpawn; i++) {
            particles.push({
              edgeId: edge.id,
              progress: Math.random() * 0.05,
              speed: 0.006 + Math.random() * 0.008,
              color,
              size: 1.8 + Math.random() * 1.5,
              alpha: 0.6 + Math.random() * 0.4,
              trail: [],
              spawnTime: now,
            })
          }
        }
      }

      // Update and draw
      const toRemove: number[] = []

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Speed scales with simulation speed
        const speedMul = state.speedMultiplier
        p.progress += p.speed * speedMul * (dt / 16)

        if (p.progress >= 1) {
          toRemove.push(i)
          continue
        }

        // Find the SVG path for this edge
        const pathEl = document.querySelector(
          `[data-id="${p.edgeId}"] .react-flow__edge-path`
        ) as SVGPathElement | null

        if (!pathEl) {
          toRemove.push(i)
          continue
        }

        const totalLen = pathEl.getTotalLength()
        if (totalLen === 0) {
          toRemove.push(i)
          continue
        }

        const pt = pathEl.getPointAtLength(p.progress * totalLen)

        // Transform flow coords -> screen coords
        const sx = pt.x * tZoom + tx
        const sy = pt.y * tZoom + ty

        // Update trail
        p.trail.push({ x: sx, y: sy })
        if (p.trail.length > 10) p.trail.shift()

        // Draw trail
        if (p.trail.length > 1) {
          ctx.beginPath()
          ctx.moveTo(p.trail[0].x, p.trail[0].y)
          for (let t = 1; t < p.trail.length; t++) {
            ctx.lineTo(p.trail[t].x, p.trail[t].y)
          }
          ctx.strokeStyle = p.color
          ctx.globalAlpha = p.alpha * 0.25
          ctx.lineWidth = p.size * 0.6
          ctx.lineCap = 'round'
          ctx.stroke()
        }

        // Draw glow
        ctx.beginPath()
        ctx.arc(sx, sy, p.size * 3, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * 3)
        grad.addColorStop(0, p.color + '4D')
        grad.addColorStop(1, p.color + '00')
        ctx.fillStyle = grad
        ctx.globalAlpha = p.alpha * 0.4
        ctx.fill()

        // Draw particle head
        ctx.beginPath()
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()

        ctx.globalAlpha = 1
      }

      // Remove dead particles
      for (let i = toRemove.length - 1; i >= 0; i--) {
        particles.splice(toRemove[i], 1)
      }

      // Cap for performance
      if (particles.length > 300) {
        particles.splice(0, particles.length - 300)
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  )
}
