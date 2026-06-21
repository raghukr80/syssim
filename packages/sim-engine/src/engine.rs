use std::collections::{BinaryHeap, HashMap, VecDeque};
use serde::{Deserialize, Serialize};

use crate::components::{Component, ComponentId, ComponentMetrics, ComponentType};

/// An event in the discrete event simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub timestamp: f64,
    pub event_type: EventType,
    pub source_id: ComponentId,
    pub target_id: ComponentId,
    pub request_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EventType {
    RequestArrival,
    RequestProcessed,
    RequestFailed,
    ResponseReturned,
    ChaosBegin,
    ChaosEnd,
}

// Reverse ordering for min-heap (BinaryHeap is max-heap by default)
impl Ord for Event {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        other.timestamp.partial_cmp(&self.timestamp).unwrap_or(std::cmp::Ordering::Equal)
    }
}

impl PartialOrd for Event {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for Event {
    fn eq(&self, other: &Self) -> bool {
        self.timestamp == other.timestamp
    }
}

impl Eq for Event {}

/// System-wide metrics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SystemMetrics {
    pub total_rps: f64,
    pub p50_latency_ms: f64,
    pub p95_latency_ms: f64,
    pub p99_latency_ms: f64,
    pub error_rate: f64,
    pub bottleneck_count: u32,
    pub latency_history: Vec<LatencySample>,
    pub component_metrics: HashMap<ComponentId, ComponentMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencySample {
    pub timestamp: f64,
    pub p50: f64,
    pub p95: f64,
    pub p99: f64,
}

/// The main simulation engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationEngine {
    pub components: HashMap<ComponentId, Component>,
    pub connections: Vec<Connection>,
    pub current_time: f64,
    pub time_step_ms: f64,
    pub speed_multiplier: f64,
    pub state: SimulationState,
    pub metrics: SystemMetrics,
    pub input_rps: f64,
    // Internal
    event_queue: BinaryHeap<Event>,
    tick_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Connection {
    pub source_id: ComponentId,
    pub target_id: ComponentId,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SimulationState {
    Idle,
    Running,
    Paused,
    Stopped,
}

impl Default for SimulationState {
    fn default() -> Self {
        SimulationState::Idle
    }
}

impl SimulationEngine {
    pub fn new() -> Self {
        Self {
            components: HashMap::new(),
            connections: Vec::new(),
            current_time: 0.0,
            time_step_ms: 100.0, // 100ms ticks
            speed_multiplier: 1.0,
            state: SimulationState::Idle,
            metrics: SystemMetrics::default(),
            input_rps: 1000.0,
            event_queue: BinaryHeap::new(),
            tick_count: 0,
        }
    }

    /// Add a component to the simulation
    pub fn add_component(&mut self, component: Component) {
        self.components.insert(component.id.clone(), component);
    }

    /// Add a connection between components
    pub fn add_connection(&mut self, source_id: &str, target_id: &str) {
        self.connections.push(Connection {
            source_id: source_id.to_string(),
            target_id: target_id.to_string(),
        });

        // Update component downstream/upstream references
        if let Some(src) = self.components.get_mut(source_id) {
            if !src.downstream.contains(&target_id.to_string()) {
                src.downstream.push(target_id.to_string());
            }
        }
        if let Some(tgt) = self.components.get_mut(target_id) {
            if !tgt.upstream.contains(&source_id.to_string()) {
                tgt.upstream.push(source_id.to_string());
            }
        }
    }

    /// Set the input RPS (arriving at client/initiator components)
    pub fn set_input_rps(&mut self, rps: f64) {
        self.input_rps = rps;
    }

    /// Start the simulation
    pub fn start(&mut self) {
        self.state = SimulationState::Running;
        self.current_time = 0.0;
        self.tick_count = 0;
        self.metrics = SystemMetrics::default();

        // Find entry point components (those with no upstream, or of type Client)
        let entry_points: Vec<String> = self.components
            .values()
            .filter(|c| c.upstream.is_empty() || matches!(c.component_type, ComponentType::Client))
            .map(|c| c.id.clone())
            .collect();

        // Seed initial events
        for id in &entry_points {
            self.event_queue.push(Event {
                timestamp: 0.0,
                event_type: EventType::RequestArrival,
                source_id: "external".to_string(),
                target_id: id.clone(),
                request_count: (self.input_rps * self.time_step_ms / 1000.0) as u64,
            });
        }
    }

    /// Run one simulation step (tick)
    pub fn step(&mut self) -> SystemMetrics {
        if self.state != SimulationState::Running {
            return self.metrics.clone();
        }

        let time_step = self.time_step_ms * self.speed_multiplier;
        self.current_time += time_step;
        self.tick_count += 1;

        // Process events in this time window
        let window_end = self.current_time;
        let mut pending_events: Vec<Event> = Vec::new();

        while let Some(event) = self.event_queue.peek() {
            if event.timestamp > window_end {
                break;
            }
            pending_events.push(self.event_queue.pop().unwrap());
        }

        // Route traffic through the topology
        self.route_traffic(time_step);

        // Update system metrics
        self.update_system_metrics();

        self.metrics.clone()
    }

    /// Route traffic through the topology
    fn route_traffic(&mut self, time_step_ms: f64) {
        // Build a processing order (topological-ish: process upstream first)
        let mut processing_order: Vec<String> = Vec::new();
        let mut visited = std::collections::HashSet::new();

        // Simple BFS from entry points
        let mut queue: VecDeque<String> = self.components
            .values()
            .filter(|c| c.upstream.is_empty())
            .map(|c| c.id.clone())
            .collect();

        while let Some(id) = queue.pop_front() {
            if visited.contains(&id) {
                continue;
            }
            visited.insert(id.clone());
            processing_order.push(id.clone());

            if let Some(comp) = self.components.get(&id) {
                for downstream_id in &comp.downstream {
                    queue.push_back(downstream_id.clone());
                }
            }
        }

        // Add any remaining components (in case of cycles or disconnected)
        for id in self.components.keys() {
            if !visited.contains(id) {
                processing_order.push(id.clone());
            }
        }

        // Process each component in order
        // Collect downstream outputs first to avoid borrow issues
        let mut outputs: HashMap<String, f64> = HashMap::new();

        for id in &processing_order {
            let input_rps = outputs.get(id).copied().unwrap_or_else(|| {
                // Entry point: use configured input RPS
                if let Some(comp) = self.components.get(id) {
                    if comp.upstream.is_empty() || matches!(comp.component_type, ComponentType::Client) {
                        return self.input_rps;
                    }
                }
                0.0
            });

            if let Some(component) = self.components.get_mut(id) {
                let result = component.process(input_rps, time_step_ms);

                // Forward output to downstream components
                for downstream_id in &component.downstream {
                    *outputs.entry(downstream_id.clone()).or_insert(0.0) += result.output_rps;
                }
            }
        }
    }

    /// Update system-wide metrics from component states
    fn update_system_metrics(&mut self) {
        let mut total_rps = 0.0;
        let mut max_p99: f64 = 0.0;
        let mut total_error_rate = 0.0;
        let mut active_components = 0;
        let mut bottleneck_count = 0;
        let mut component_metrics = HashMap::new();

        for (id, component) in &self.components {
            if component.upstream.is_empty() && !matches!(component.component_type, ComponentType::Client) {
                continue; // Skip entry-point sources
            }

            total_rps += component.metrics.current_rps;
            max_p99 = max_p99.max(component.metrics.p99_latency_ms);
            total_error_rate += component.metrics.error_rate;
            active_components += 1;

            if component.metrics.utilization > 0.8 {
                bottleneck_count += 1;
            }

            component_metrics.insert(id.clone(), component.metrics.clone());
        }

        let avg_error_rate = if active_components > 0 {
            total_error_rate / active_components as f64
        } else {
            0.0
        };

        // Add latency sample
        let sample = LatencySample {
            timestamp: self.current_time,
            p50: max_p99 * 0.3,
            p95: max_p99 * 0.8,
            p99: max_p99,
        };

        self.metrics.total_rps = total_rps;
        self.metrics.p99_latency_ms = max_p99;
        self.metrics.error_rate = avg_error_rate;
        self.metrics.bottleneck_count = bottleneck_count;
        self.metrics.component_metrics = component_metrics;

        // Keep last 60 samples
        self.metrics.latency_history.push(sample);
        if self.metrics.latency_history.len() > 60 {
            self.metrics.latency_history.remove(0);
        }
    }

    pub fn pause(&mut self) {
        self.state = SimulationState::Paused;
    }

    pub fn resume(&mut self) {
        self.state = SimulationState::Running;
    }

    pub fn stop(&mut self) {
        self.state = SimulationState::Stopped;
        self.current_time = 0.0;
        self.tick_count = 0;
        self.event_queue.clear();

        // Reset all components
        for component in self.components.values_mut() {
            component.status = crate::components::ComponentStatus::Idle;
            component.metrics = ComponentMetrics::default();
            component.current_load = 0.0;
            component.active_connections = 0;
            component.is_failed = false;
        }
    }

    pub fn set_speed(&mut self, multiplier: f64) {
        self.speed_multiplier = multiplier;
    }
}
