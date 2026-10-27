import { z } from 'zod';

export const RunStatusSchema = z.enum(['completed', 'running', 'failed', 'pending']);

export const EpochMetricSchema = z.object({
  epoch: z.number().int().min(1),
  train_loss: z.number(),
  val_loss: z.number(),
  train_oa: z.number(),
  val_oa: z.number(),
  train_f1: z.number().optional(),
  val_f1: z.number().optional(),
  learning_rate: z.number(),
  gpu_mem_mb: z.number().optional(),
  epoch_time_s: z.number().optional(),
});

export const RunMetadataSchema = z.object({
  dataset: z.string().min(1),
  dataset_type: z.enum(['hyperspectral', 'computer_vision', 'multimodal', 'custom']).default('hyperspectral'),
  spatial_size: z.string().optional(),
  spectral_bands: z.number().int().positive().optional(),
  classes_count: z.number().int().positive().default(16),
  split_method: z.string().default('Disjoint Spatial Sampling (10% train, 90% test)'),
  preprocessing: z.array(z.string()).optional(),
  seed: z.number().int().default(42),
  code_commit: z.string().optional(),
  environment: z.string().optional(),
});

export const HyperparametersSchema = z.object({
  architecture: z.string().min(1),
  model_family: z.enum(['Transformer', 'Hybrid-CNN', '3D-CNN', '2D-CNN', 'ResNet', 'Other']).default('Hybrid-CNN'),
  optimizer: z.string().default('AdamW'),
  learning_rate: z.number().positive().default(0.001),
  weight_decay: z.number().min(0).default(0.0001),
  batch_size: z.number().int().positive().default(64),
  lr_scheduler: z.string().default('CosineAnnealingLR'),
  loss_function: z.string().default('CrossEntropy'),
  dropout: z.number().min(0).max(1).default(0.3),
  label_smoothing: z.number().min(0).max(1).optional(),
  epochs: z.number().int().positive().default(100),
  patch_size: z.number().int().positive().optional(),
});

export const RunResultsSchema = z.object({
  overall_accuracy: z.number().min(0).max(100),
  average_accuracy: z.number().min(0).max(100),
  cohens_kappa: z.number().min(-1).max(1),
  macro_f1: z.number().min(0).max(100),
  flops_gflops: z.number().positive().optional(),
  params_m: z.number().positive().optional(),
  inference_latency_ms: z.number().positive().optional(),
  training_duration_s: z.number().positive().optional(),
  peak_gpu_mem_mb: z.number().positive().optional(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).default(''),
  domain: z.enum(['hyperspectral', 'computer_vision', 'multimodal']).default('hyperspectral'),
  dataset: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export const CreateRunSchema = z.object({
  project_id: z.string().min(1),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  status: RunStatusSchema.default('completed'),
  metadata: RunMetadataSchema,
  hyperparameters: HyperparametersSchema,
  results: RunResultsSchema,
  epochs: z.array(EpochMetricSchema).default([]),
  confusion_matrix: z.array(z.array(z.number())).optional(),
  class_names: z.array(z.string()).optional(),
  artifacts: z.object({
    checkpoint_url: z.string().optional(),
    log_file_name: z.string().optional(),
    classification_map_url: z.string().optional(),
    config_yaml: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

export const ImportRunSchema = z.object({
  project_id: z.string().min(1),
  format: z.enum(['json', 'csv', 'tensorboard']),
  payload: z.string().min(1), // serialized CSV text or JSON or tensorboard event summary
  override_name: z.string().optional(),
});

export const AnalyzeRequestSchema = z.object({
  run_ids: z.array(z.string()).min(1),
  focus: z.enum(['general', 'overfitting', 'efficiency', 'hyperparameters', 'ablation']).default('general'),
  prompt: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  project_id: z.string().optional(),
  run_ids: z.array(z.string()).default([]),
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).default([]),
});
