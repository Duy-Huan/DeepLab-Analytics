export type RunStatus = 'completed' | 'running' | 'failed' | 'pending';

export interface EpochMetric {
  epoch: number;
  train_loss: number;
  val_loss: number;
  train_oa: number;
  val_oa: number;
  train_f1?: number;
  val_f1?: number;
  learning_rate: number;
  gpu_mem_mb?: number;
  epoch_time_s?: number;
}

export interface ClassPerformance {
  class_id: number;
  class_name: string;
  samples: number;
  correct: number;
  accuracy: number; // percentage 0 - 100
  precision: number;
  recall: number;
  f1: number;
}

export interface RunMetadata {
  dataset: string;
  dataset_type: 'hyperspectral' | 'computer_vision' | 'multimodal' | 'custom';
  spatial_size?: string; // e.g. "15x15" or "224x224"
  spectral_bands?: number; // e.g. 200 or 103
  classes_count: number;
  split_method: string; // e.g. "Disjoint Spatial Sampling (10% train, 90% test)"
  preprocessing?: string[]; // e.g. ["StandardScaler", "PCA (30 components)", "RandomFlip"]
  seed: number;
  code_commit?: string;
  environment?: string; // e.g. "PyTorch 2.4.0 + CUDA 12.4 (NVIDIA A100-SXM4-40GB)"
}

export interface Hyperparameters {
  architecture: string;
  model_family: 'Transformer' | 'Hybrid-CNN' | '3D-CNN' | '2D-CNN' | 'ResNet' | 'Other';
  optimizer: string;
  learning_rate: number;
  weight_decay: number;
  batch_size: number;
  lr_scheduler: string;
  loss_function: string;
  dropout: number;
  label_smoothing?: number;
  epochs: number;
  patch_size?: number;
}

export interface RunResults {
  overall_accuracy: number; // OA % (0-100)
  average_accuracy: number; // AA % (0-100)
  cohens_kappa: number;     // Kappa (0.000 - 1.000)
  macro_f1: number;         // F1 % (0-100)
  flops_gflops?: number;    // GFLOPs
  params_m?: number;        // Million parameters
  inference_latency_ms?: number; // ms per batch
  training_duration_s?: number;  // total training seconds
  peak_gpu_mem_mb?: number;      // Peak VRAM
}

export interface DiagnosticAlert {
  type: 'overfitting' | 'underfitting' | 'instability' | 'divergence' | 'plateau' | 'leakage_risk' | 'healthy';
  severity: 'high' | 'medium' | 'low' | 'info';
  title: string;
  epoch_range?: [number, number];
  observed_evidence: string;
  derived_calculation: string;
  recommendation: string;
}

export interface ExperimentRun {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: RunStatus;
  created_at: string;
  completed_at?: string;
  is_demo?: boolean;
  metadata: RunMetadata;
  hyperparameters: Hyperparameters;
  results: RunResults;
  epochs: EpochMetric[];
  confusion_matrix?: number[][];
  class_names?: string[];
  per_class?: ClassPerformance[];
  diagnostics?: DiagnosticAlert[];
  artifacts?: {
    checkpoint_url?: string;
    log_file_name?: string;
    classification_map_url?: string;
    config_yaml?: string;
  };
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  domain: 'hyperspectral' | 'computer_vision' | 'multimodal';
  created_at: string;
  updated_at: string;
  dataset: string;
  run_count?: number;
  best_oa?: number;
  tags: string[];
}

export interface ScientificReport {
  id: string;
  project_id: string;
  title: string;
  abstract: string;
  created_at: string;
  compared_run_ids: string[];
  findings: string[];
  latex_table: string;
  markdown_content: string;
  ablation_analysis?: string;
  recommendations: string[];
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'google_drive' | 'google_colab' | 'pytorch_runtime' | 'tensorboard' | 'phd_research_lab' | 'hermes_agent';
  status: 'connected' | 'disconnected' | 'configured' | 'pending';
  endpoint_url?: string;
  last_sync?: string;
  details: string;
  config_fields: { [key: string]: string };
}
