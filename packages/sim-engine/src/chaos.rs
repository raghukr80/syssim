use serde::{Deserialize, Serialize};
use crate::components::{ComponentId, ComponentType};

/// Categories of chaos scenarios
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChaosCategory {
    Network,
    Infrastructure,
    Traffic,
    Data,
    Application,
    Dependency,
}

/// A chaos scenario that can be injected into the simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChaosScenario {
    pub id: String,
    pub name: String,
    pub category: ChaosCategory,
    pub description: String,
    pub target_types: Vec<ComponentType>,
    pub effect: ChaosEffect,
    /// Duration in seconds (None = permanent until removed)
    pub duration: Option<f64>,
}

/// The effect a chaos scenario has on a component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChaosEffect {
    /// Inject additional latency
    LatencyInjection {
        delay_ms: f64,
        jitter_ms: f64,
    },
    /// Increase error rate
    ErrorInjection {
        error_rate: f64,
    },
    /// Throttle throughput
    ThroughputThrottle {
        max_rps: f64,
    },
    /// Kill the component (100% error rate)
    NodeFailure {
        recovery_time_ms: f64,
    },
    /// Packet loss (random message drops)
    PacketLoss {
        percentage: f64,
    },
    /// CPU spike (increases latency)
    CpuSpike {
        multiplier: f64,
    },
    /// Memory pressure (reduces effective capacity)
    MemoryPressure {
        capacity_multiplier: f64,
    },
}

impl ChaosEffect {
    /// Apply this effect to a component's config, returning modified config values
    pub fn apply(&self, max_rps: f64, latency_p50: f64, latency_p99: f64, failure_rate: f64) -> (f64, f64, f64, f64) {
        match self {
            ChaosEffect::LatencyInjection { delay_ms, .. } => {
                (max_rps, latency_p50 + delay_ms, latency_p99 + delay_ms * 2.0, failure_rate)
            }
            ChaosEffect::ErrorInjection { error_rate: new_error } => {
                (max_rps, latency_p50, latency_p99, failure_rate + new_error)
            }
            ChaosEffect::ThroughputThrottle { max_rps: new_max } => {
                (max_rps.min(*new_max), latency_p50, latency_p99, failure_rate)
            }
            ChaosEffect::NodeFailure { .. } => {
                (0.0, latency_p50, latency_p99, 1.0)
            }
            ChaosEffect::PacketLoss { percentage } => {
                (max_rps, latency_p50, latency_p99, failure_rate + percentage)
            }
            ChaosEffect::CpuSpike { multiplier } => {
                (max_rps, latency_p50 * multiplier, latency_p99 * multiplier, failure_rate)
            }
            ChaosEffect::MemoryPressure { capacity_multiplier } => {
                (max_rps * capacity_multiplier, latency_p50, latency_p99, failure_rate)
            }
        }
    }
}

/// Predefined chaos scenarios
pub fn all_chaos_scenarios() -> Vec<ChaosScenario> {
    vec![
        // Network
        ChaosScenario {
            id: "net_latency".into(),
            name: "Latency Injection".into(),
            category: ChaosCategory::Network,
            description: "Add 200ms of latency to all requests".into(),
            target_types: vec![],
            effect: ChaosEffect::LatencyInjection { delay_ms: 200.0, jitter_ms: 50.0 },
            duration: Some(30.0),
        },
        ChaosScenario {
            id: "net_partition".into(),
            name: "Network Partition".into(),
            category: ChaosCategory::Network,
            description: "Complete network isolation".into(),
            target_types: vec![],
            effect: ChaosEffect::NodeFailure { recovery_time_ms: 5000.0 },
            duration: Some(15.0),
        },
        ChaosScenario {
            id: "net_packet_loss".into(),
            name: "Packet Loss".into(),
            category: ChaosCategory::Network,
            description: "Random 20% packet loss".into(),
            target_types: vec![],
            effect: ChaosEffect::PacketLoss { percentage: 0.2 },
            duration: None,
        },

        // Infrastructure
        ChaosScenario {
            id: "infra_node_failure".into(),
            name: "Node Failure".into(),
            category: ChaosCategory::Infrastructure,
            description: "Kill the component entirely".into(),
            target_types: vec![],
            effect: ChaosEffect::NodeFailure { recovery_time_ms: 10000.0 },
            duration: None,
        },
        ChaosScenario {
            id: "infra_cpu_spike".into(),
            name: "CPU Spike".into(),
            category: ChaosCategory::Infrastructure,
            description: "3x latency increase from CPU pressure".into(),
            target_types: vec![],
            effect: ChaosEffect::CpuSpike { multiplier: 3.0 },
            duration: Some(30.0),
        },
        ChaosScenario {
            id: "infra_memory_pressure".into(),
            name: "Memory Pressure".into(),
            category: ChaosCategory::Infrastructure,
            description: "50% capacity reduction".into(),
            target_types: vec![],
            effect: ChaosEffect::MemoryPressure { capacity_multiplier: 0.5 },
            duration: None,
        },

        // Traffic
        ChaosScenario {
            id: "traffic_spike".into(),
            name: "Traffic Spike".into(),
            category: ChaosCategory::Traffic,
            description: "Double the input RPS".into(),
            target_types: vec![ComponentType::Client],
            effect: ChaosEffect::ThroughputThrottle { max_rps: f64::MAX },
            duration: Some(10.0),
        },

        // Data
        ChaosScenario {
            id: "data_replication_lag".into(),
            name: "Replication Lag".into(),
            category: ChaosCategory::Data,
            description: "Database read replicas lag by 500ms".into(),
            target_types: vec![ComponentType::Database],
            effect: ChaosEffect::LatencyInjection { delay_ms: 500.0, jitter_ms: 200.0 },
            duration: None,
        },
        ChaosScenario {
            id: "data_cache_stampede".into(),
            name: "Cache Stampede".into(),
            category: ChaosCategory::Data,
            description: "Cache hit ratio drops to 50%".into(),
            target_types: vec![ComponentType::Cache],
            effect: ChaosEffect::MemoryPressure { capacity_multiplier: 0.3 },
            duration: None,
        },

        // Application
        ChaosScenario {
            id: "app_cascading".into(),
            name: "Cascading Failure".into(),
            category: ChaosCategory::Application,
            description: "Progressive failure across components".into(),
            target_types: vec![],
            effect: ChaosEffect::ErrorInjection { error_rate: 0.3 },
            duration: None,
        },

        // Dependency
        ChaosScenario {
            id: "dep_timeout".into(),
            name: "Dependency Timeout".into(),
            category: ChaosCategory::Dependency,
            description: "Third-party API starts timing out".into(),
            target_types: vec![ComponentType::ThirdPartyApi],
            effect: ChaosEffect::LatencyInjection { delay_ms: 5000.0, jitter_ms: 1000.0 },
            duration: None,
        },
    ]
}
