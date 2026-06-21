use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

pub mod components;
pub mod engine;

use crate::components::{Component, ComponentConfig, ComponentId, ComponentMetrics, ComponentType};
use crate::engine::{SimulationEngine, SystemMetrics};

/// JavaScript-facing simulation controller
#[wasm_bindgen]
pub struct SimController {
    engine: SimulationEngine,
}

#[wasm_bindgen]
impl SimController {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            engine: SimulationEngine::new(),
        }
    }

    #[wasm_bindgen(js_name = "addComponent")]
    pub fn add_component(&mut self, id: String, component_type: String, config_json: String) {
        let config: ComponentConfig = serde_json::from_str(&config_json).unwrap_or_default();

        let ct = match component_type.as_str() {
            "load_balancer" => ComponentType::LoadBalancer,
            "api_gateway" => ComponentType::ApiGateway,
            "cdn" => ComponentType::Cdn,
            "dns" => ComponentType::Dns,
            "web_server" => ComponentType::WebServer,
            "serverless" => ComponentType::Serverless,
            "container_cluster" => ComponentType::ContainerCluster,
            "database" => ComponentType::Database,
            "cache" => ComponentType::Cache,
            "storage" => ComponentType::Storage,
            "message_queue" => ComponentType::MessageQueue,
            "event_bus" => ComponentType::EventBus,
            "third_party_api" => ComponentType::ThirdPartyApi,
            "client" => ComponentType::Client,
            _ => ComponentType::WebServer,
        };

        let component = Component::new(id, ct, config);
        self.engine.add_component(component);
    }

    #[wasm_bindgen(js_name = "addConnection")]
    pub fn add_connection(&mut self, source_id: String, target_id: String) {
        self.engine.add_connection(&source_id, &target_id);
    }

    #[wasm_bindgen(js_name = "setInputRps")]
    pub fn set_input_rps(&mut self, rps: f64) {
        self.engine.set_input_rps(rps);
    }

    pub fn start(&mut self) {
        self.engine.start();
    }

    pub fn pause(&mut self) {
        self.engine.pause();
    }

    pub fn resume(&mut self) {
        self.engine.resume();
    }

    pub fn stop(&mut self) {
        self.engine.stop();
    }

    #[wasm_bindgen(js_name = "step")]
    pub fn step(&mut self) -> String {
        let metrics = self.engine.step();
        serde_json::to_string(&metrics).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen(js_name = "setSpeed")]
    pub fn set_speed(&mut self, multiplier: f64) {
        self.engine.set_speed(multiplier);
    }

    #[wasm_bindgen(js_name = "getMetrics")]
    pub fn get_metrics(&self) -> String {
        serde_json::to_string(&self.engine.metrics).unwrap_or_else(|_| "{}".to_string())
    }
}
