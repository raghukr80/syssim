use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::components::{ComponentType, ComponentId};

/// AWS cost estimation for a component
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentCost {
    pub component_id: ComponentId,
    pub aws_service: String,
    pub monthly_compute: f64,
    pub monthly_storage: f64,
    pub monthly_networking: f64,
    pub monthly_requests: f64,
    pub total_monthly: f64,
}

/// System-wide cost estimate
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CostEstimate {
    pub components: Vec<ComponentCost>,
    pub total_compute: f64,
    pub total_storage: f64,
    pub total_networking: f64,
    pub total_requests: f64,
    pub total_monthly: f64,
}

pub struct CostEstimator;

impl CostEstimator {
    /// Estimate monthly cost for the given topology
    pub fn estimate(component_types: &HashMap<ComponentId, ComponentType>, rps_per_component: &HashMap<ComponentId, f64>) -> CostEstimate {
        let mut components = Vec::new();
        let mut total = CostEstimate::default();

        for (id, comp_type) in component_types {
            let rps = rps_per_component.get(id).copied().unwrap_or(0.0);
            let cost = Self::estimate_component(comp_type, rps);

            total.total_compute += cost.monthly_compute;
            total.total_storage += cost.monthly_storage;
            total.total_networking += cost.monthly_networking;
            total.total_requests += cost.monthly_requests;
            total.total_monthly += cost.total_monthly;

            components.push(cost);
        }

        total.components = components;
        total
    }

    fn estimate_component(comp_type: &ComponentType, rps: f64) -> ComponentCost {
        let (aws_service, compute, storage, networking, requests) = match comp_type {
            ComponentType::LoadBalancer => ("ALB", 22.0, 0.0, rps * 0.008, rps * 0.0000002 * 2.6e6),
            ComponentType::ApiGateway => ("API Gateway", 0.0, 0.0, 0.0, rps * 0.0000035 * 2.6e6),
            ComponentType::Cdn => ("CloudFront", 0.0, 0.0, rps * 0.001, rps * 0.0000001 * 2.6e6),
            ComponentType::Dns => ("Route 53", 0.0, 0.0, 0.0, rps * 0.0000004 * 2.6e6),
            ComponentType::WebServer => ("EC2 m5.large", 70.0, 0.0, rps * 0.001, 0.0),
            ComponentType::Serverless => ("Lambda", 0.0, 0.0, 0.0, rps * 0.0000002 * 2.6e6 + rps * 0.0000000025 * 2.6e6),
            ComponentType::ContainerCluster => ("ECS Fargate", 150.0, 0.0, rps * 0.002, 0.0),
            ComponentType::Database => ("RDS PostgreSQL", 120.0, 23.0, rps * 0.0005, 0.0),
            ComponentType::Cache => ("ElastiCache", 45.0, 0.0, rps * 0.0001, 0.0),
            ComponentType::Storage => ("S3", 0.0, rps * 0.00001 * 2.6e6, rps * 0.001, rps * 0.0000004 * 2.6e6),
            ComponentType::MessageQueue => ("MSK Kafka", 200.0, 10.0, rps * 0.001, 0.0),
            ComponentType::EventBus => ("EventBridge", 0.0, 0.0, 0.0, rps * 0.000001 * 2.6e6),
            ComponentType::ThirdPartyApi => ("N/A", 0.0, 0.0, 0.0, 0.0),
            ComponentType::Client => ("N/A", 0.0, 0.0, 0.0, 0.0),
        };

        ComponentCost {
            component_id: String::new(),
            aws_service: aws_service.into(),
            monthly_compute: compute,
            monthly_storage: storage,
            monthly_networking: networking,
            monthly_requests: requests,
            total_monthly: compute + storage + networking + requests,
        }
    }
}
