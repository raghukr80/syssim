use serde::{Deserialize, Serialize};

/// Unique identifier for a component in the simulation
pub type ComponentId = String;

/// Types of components that can exist in the simulation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ComponentType {
    LoadBalancer,
    ApiGateway,
    Cdn,
    Dns,
    WebServer,
    Serverless,
    ContainerCluster,
    Database,
    Cache,
    Storage,
    MessageQueue,
    EventBus,
    ThirdPartyApi,
    Client,
}

/// Configuration for a component's behavior
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentConfig {
    pub max_rps: f64,
    pub latency_p50_ms: f64,
    pub latency_p95_ms: f64,
    pub latency_p99_ms: f64,
    pub connection_limit: u32,
    pub failure_rate: f64,
    // Type-specific
    pub cache_hit_ratio: Option<f64>,
    pub replication_factor: Option<u32>,
    pub partition_count: Option<u32>,
}

impl Default for ComponentConfig {
    fn default() -> Self {
        Self {
            max_rps: 1000.0,
            latency_p50_ms: 10.0,
            latency_p95_ms: 50.0,
            latency_p99_ms: 200.0,
            connection_limit: 100,
            failure_rate: 0.01,
            cache_hit_ratio: None,
            replication_factor: None,
            partition_count: None,
        }
    }
}

/// Runtime metrics for a component during simulation
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ComponentMetrics {
    pub current_rps: f64,
    pub avg_latency_ms: f64,
    pub p99_latency_ms: f64,
    pub error_rate: f64,
    pub queue_depth: u32,
    pub utilization: f64, // 0-1
}

/// A component in the simulation topology
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Component {
    pub id: ComponentId,
    pub component_type: ComponentType,
    pub config: ComponentConfig,
    pub status: ComponentStatus,
    pub metrics: ComponentMetrics,
    // Connections
    pub downstream: Vec<ComponentId>,
    pub upstream: Vec<ComponentId>,
    // Internal state
    pub current_load: f64,
    pub active_connections: u32,
    pub is_failed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ComponentStatus {
    Idle,
    Running,
    Degraded,
    Failed,
}

impl Default for ComponentStatus {
    fn default() -> Self {
        ComponentStatus::Idle
    }
}

impl Component {
    pub fn new(id: ComponentId, component_type: ComponentType, config: ComponentConfig) -> Self {
        Self {
            id,
            component_type,
            config,
            status: ComponentStatus::Idle,
            metrics: ComponentMetrics::default(),
            downstream: Vec::new(),
            upstream: Vec::new(),
            current_load: 0.0,
            active_connections: 0,
            is_failed: false,
        }
    }

    /// Process a request through this component. Returns the output RPS and latency.
    pub fn process(&mut self, input_rps: f64, _time_step_ms: f64) -> ComponentResult {
        if self.is_failed || self.status == ComponentStatus::Failed {
            return ComponentResult {
                output_rps: 0.0,
                latency_ms: 0.0,
                error_rate: 1.0,
                dropped_rps: input_rps,
            };
        }

        // Calculate utilization
        let utilization = (input_rps / self.config.max_rps).min(1.5);
        self.metrics.utilization = utilization;
        self.current_load = input_rps;

        // Determine output based on capacity
        let output_rps = if utilization <= 1.0 {
            input_rps
        } else {
            // Overloaded — drop excess
            self.config.max_rps
        };

        let dropped_rps = input_rps - output_rps;

        // Calculate latency based on utilization (queuing theory approximation)
        let latency_multiplier = if utilization < 0.5 {
            1.0
        } else if utilization < 0.8 {
            1.0 + (utilization - 0.5) * 2.0
        } else if utilization < 1.0 {
            1.6 + (utilization - 0.8) * 8.0
        } else {
            3.2 + (utilization - 1.0) * 10.0 // Sharp increase when overloaded
        };

        let latency_ms = self.config.latency_p50_ms * latency_multiplier;
        let p99_latency_ms = self.config.latency_p99_ms * latency_multiplier;

        // Calculate error rate
        let base_error = self.config.failure_rate;
        let overload_error = if utilization > 0.9 {
            (utilization - 0.9) * 0.5 // Up to 50% errors when severely overloaded
        } else {
            0.0
        };
        let error_rate = (base_error + overload_error).min(1.0);

        // Update metrics
        self.metrics.current_rps = output_rps;
        self.metrics.avg_latency_ms = latency_ms;
        self.metrics.p99_latency_ms = p99_latency_ms;
        self.metrics.error_rate = error_rate;
        self.metrics.queue_depth = ((utilization.max(1.0) - 1.0) * 100.0) as u32;

        // Update status
        self.status = if error_rate > 0.1 {
            ComponentStatus::Failed
        } else if utilization > 0.8 {
            ComponentStatus::Degraded
        } else {
            ComponentStatus::Running
        };

        ComponentResult {
            output_rps,
            latency_ms,
            error_rate,
            dropped_rps,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ComponentResult {
    pub output_rps: f64,
    pub latency_ms: f64,
    pub error_rate: f64,
    pub dropped_rps: f64,
}
