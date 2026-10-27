import fs from 'fs';
import path from 'path';
import { ExperimentRun, Project, ScientificReport, IntegrationConfig } from '../src/types';
import { calculateOverallAccuracy, calculateAverageAccuracy, calculateCohensKappa, calculatePerClassMetrics } from '../src/utils/metrics';
import { diagnoseTrainingRun } from '../src/utils/diagnostics';

interface DatabaseSchema {
  projects: Project[];
  runs: ExperimentRun[];
  reports: ScientificReport[];
  integrations: IntegrationConfig[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'deeplab_store.json');

// Indian Pines 16 official classes
export const INDIAN_PINES_CLASSES = [
  'Alfalfa',
  'Corn-notill',
  'Corn-mintill',
  'Corn',
  'Grass-pasture',
  'Grass-trees',
  'Grass-pasture-mowed',
  'Hay-windrowed',
  'Oats',
  'Soybean-notill',
  'Soybean-mintill',
  'Soybean-clean',
  'Wheat',
  'Woods',
  'Buildings-Grass-Trees-Drives',
  'Stone-Steel-Towers',
];

// Pavia University 9 official classes
export const PAVIA_U_CLASSES = [
  'Asphalt',
  'Meadows',
  'Gravel',
  'Trees',
  'Painted metal sheets',
  'Bare Soil',
  'Bitumen',
  'Self-Blocking Bricks',
  'Shadows',
];

function generateIndianPinesConfusionMatrix(seedAccuracy: number): number[][] {
  const n = 16;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  // realistic class test sample counts (total ~9200 test pixels)
  const classCounts = [
    41, 1285, 747, 213, 434, 657, 25, 439, 18, 875, 2210, 534, 184, 1148, 347, 85,
  ];

  for (let i = 0; i < n; i++) {
    const total = classCounts[i];
    // Vary accuracy slightly per class (rare classes like Alfalfa or Oats have lower recall)
    const penalty = (i === 0 || i === 8 || i === 6) ? 0.08 : 0.0;
    const classAcc = Math.max(0.65, Math.min(0.999, seedAccuracy - penalty));
    const correct = Math.round(total * classAcc);
    matrix[i][i] = correct;
    let remaining = total - correct;

    // Distribute errors to confusing classes (e.g. Corn vs Corn-notill vs Soybean)
    while (remaining > 0) {
      const target = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
      const count = Math.min(remaining, Math.ceil(Math.random() * 5));
      matrix[i][target] += count;
      remaining -= count;
    }
  }
  return matrix;
}

function generateEpochs(
  count: number,
  initialLoss: number,
  finalTrainLoss: number,
  finalValLoss: number,
  finalTrainOA: number,
  finalValOA: number,
  overfittingAfterEpoch?: number,
  instabilityEpoch?: number
) {
  const epochs = [];
  const baseLR = 0.001;

  for (let ep = 1; ep <= count; ep++) {
    const progress = ep / count;
    // Cosine decay progress
    const smooth = 0.5 * (1 - Math.cos(Math.PI * progress));

    let trainLoss = initialLoss - (initialLoss - finalTrainLoss) * smooth;
    let valLoss = initialLoss - (initialLoss - finalValLoss) * smooth;

    let trainOA = 40 + (finalTrainOA - 40) * Math.pow(progress, 0.6);
    let valOA = 38 + (finalValOA - 38) * Math.pow(progress, 0.6);

    // Overfitting simulation
    if (overfittingAfterEpoch && ep >= overfittingAfterEpoch) {
      const overProgress = (ep - overfittingAfterEpoch) / (count - overfittingAfterEpoch);
      valLoss += 0.45 * overProgress;
      valOA -= 3.5 * overProgress;
      trainLoss = Math.max(0.01, trainLoss - 0.05 * overProgress);
      trainOA = Math.min(99.9, trainOA + 2.0 * overProgress);
    }

    // Instability spike simulation
    if (instabilityEpoch && ep === instabilityEpoch) {
      valLoss *= 2.8;
      valOA -= 8.0;
    }

    // Learning rate cosine schedule
    const lr = baseLR * 0.5 * (1 + Math.cos((Math.PI * ep) / count));

    epochs.push({
      epoch: ep,
      train_loss: Number(Math.max(0.005, trainLoss).toFixed(4)),
      val_loss: Number(Math.max(0.01, valLoss).toFixed(4)),
      train_oa: Number(Math.min(100, Math.max(10, trainOA)).toFixed(2)),
      val_oa: Number(Math.min(100, Math.max(10, valOA)).toFixed(2)),
      train_f1: Number(Math.min(100, Math.max(10, trainOA - 0.8)).toFixed(2)),
      val_f1: Number(Math.min(100, Math.max(10, valOA - 1.2)).toFixed(2)),
      learning_rate: Number(lr.toFixed(6)),
      gpu_mem_mb: 2840 + Math.round(Math.random() * 80),
      epoch_time_s: Number((2.8 + Math.random() * 0.4).toFixed(2)),
    });
  }
  return epochs;
}

function createSeedData(): DatabaseSchema {
  // 1. Projects
  const projects: Project[] = [
    {
      id: 'proj-indian-pines',
      name: 'Indian Pines HSI Benchmark',
      description: 'Comprehensive evaluation of spectral-spatial deep learning architectures on the AVIRIS Indian Pines 200-band dataset with disjoint spatial sampling.',
      domain: 'hyperspectral',
      dataset: 'Indian Pines (AVIRIS 200 Bands)',
      created_at: '2026-09-12T08:00:00Z',
      updated_at: '2026-10-25T14:30:00Z',
      tags: ['HSI', 'AVIRIS', 'Transformers', '3D-CNN', 'Disjoint-Partitioning'],
    },
    {
      id: 'proj-pavia-university',
      name: 'Pavia University High-Res HSI',
      description: 'Urban land-cover classification using ROSIS 103-band hyperspectral data with 1.3m spatial resolution.',
      domain: 'hyperspectral',
      dataset: 'Pavia University (ROSIS 103 Bands)',
      created_at: '2026-09-20T10:00:00Z',
      updated_at: '2026-10-24T18:00:00Z',
      tags: ['HSI', 'ROSIS', 'High-Res', 'Urban-Mapping'],
    },
    {
      id: 'proj-cv-benchmarks',
      name: 'Compact Vision Backbones Study',
      description: 'Investigation of lightweight visual transformers vs modern depthwise ConvNets on sample-efficient vision tasks.',
      domain: 'computer_vision',
      dataset: 'Mini-ImageNet / CIFAR-100',
      created_at: '2026-10-01T09:00:00Z',
      updated_at: '2026-10-22T11:20:00Z',
      tags: ['CV', 'ConvNeXt', 'ViT', 'Efficiency'],
    },
  ];

  // 2. Runs for Indian Pines
  const ssfttMatrix = generateIndianPinesConfusionMatrix(0.984);
  const ssfttEpochs = generateEpochs(40, 2.1, 0.045, 0.082, 99.4, 98.42);

  const hybridSnMatrix = generateIndianPinesConfusionMatrix(0.971);
  const hybridSnEpochs = generateEpochs(40, 2.3, 0.078, 0.125, 98.8, 97.10);

  const spectralFormerMatrix = generateIndianPinesConfusionMatrix(0.963);
  const spectralFormerEpochs = generateEpochs(40, 2.2, 0.065, 0.145, 98.5, 96.35, 30);

  const cnn3dMatrix = generateIndianPinesConfusionMatrix(0.915);
  const cnn3dEpochs = generateEpochs(40, 2.6, 0.22, 0.31, 94.2, 91.50);

  // Overfitting test model
  const overfittedMatrix = generateIndianPinesConfusionMatrix(0.892);
  const overfittedEpochs = generateEpochs(40, 2.4, 0.012, 0.48, 99.8, 89.20, 18, 12);

  const runs: ExperimentRun[] = [
    {
      id: 'RUN-HSI-01',
      project_id: 'proj-indian-pines',
      name: 'SSFTT (Spectral-Spatial Tokenizer)',
      description: 'Gaussian tokenizer 3D-2D CNN feature extractor followed by lightweight Transformer encoder.',
      status: 'completed',
      created_at: '2026-10-18T10:15:00Z',
      completed_at: '2026-10-18T10:22:30Z',
      is_demo: true,
      metadata: {
        dataset: 'Indian Pines',
        dataset_type: 'hyperspectral',
        spatial_size: '15x15',
        spectral_bands: 200,
        classes_count: 16,
        split_method: 'Disjoint Spatial Sampling (10% train, 90% test)',
        preprocessing: ['StandardScaler', 'PCA (30 components)', 'Spatial Mirror Padding'],
        seed: 42,
        code_commit: 'git-a4f91bc',
        environment: 'PyTorch 2.4.0 + CUDA 12.4 (NVIDIA A100-SXM4-40GB)',
      },
      hyperparameters: {
        architecture: 'SSFTT-Transformer',
        model_family: 'Transformer',
        optimizer: 'AdamW',
        learning_rate: 0.001,
        weight_decay: 0.0001,
        batch_size: 64,
        lr_scheduler: 'CosineAnnealingLR (T_max=40)',
        loss_function: 'CrossEntropyLoss (label_smoothing=0.05)',
        dropout: 0.3,
        epochs: 40,
        patch_size: 15,
      },
      results: {
        overall_accuracy: 98.42,
        average_accuracy: 97.80,
        cohens_kappa: 0.9820,
        macro_f1: 97.65,
        flops_gflops: 1.84,
        params_m: 0.58,
        inference_latency_ms: 4.2,
        training_duration_s: 114.5,
        peak_gpu_mem_mb: 2890,
      },
      epochs: ssfttEpochs,
      confusion_matrix: ssfttMatrix,
      class_names: INDIAN_PINES_CLASSES,
      per_class: calculatePerClassMetrics(ssfttMatrix, INDIAN_PINES_CLASSES),
      diagnostics: diagnoseTrainingRun(ssfttEpochs),
      artifacts: {
        checkpoint_url: '/artifacts/RUN-HSI-01/ssftt_best_weights.pt',
        log_file_name: 'ssftt_training.log',
        classification_map_url: '/assets/indian_pines_ssftt_map.png',
      },
      notes: 'State-of-the-art result on 10% training split. Gaussian tokenization captures both fine spectral absorption lines and local spatial textures with minimal parameter budget.',
    },
    {
      id: 'RUN-HSI-02',
      project_id: 'proj-indian-pines',
      name: 'HybridSN (3D-2D CNN)',
      description: 'Progressive spectral-spatial feature extraction using three 3D convolution layers followed by 2D convolution.',
      status: 'completed',
      created_at: '2026-10-19T14:20:00Z',
      completed_at: '2026-10-19T14:31:10Z',
      is_demo: true,
      metadata: {
        dataset: 'Indian Pines',
        dataset_type: 'hyperspectral',
        spatial_size: '25x25',
        spectral_bands: 200,
        classes_count: 16,
        split_method: 'Disjoint Spatial Sampling (10% train, 90% test)',
        preprocessing: ['StandardScaler', 'PCA (30 components)'],
        seed: 42,
        code_commit: 'git-b12e389',
        environment: 'PyTorch 2.4.0 + CUDA 12.4 (NVIDIA A100-SXM4-40GB)',
      },
      hyperparameters: {
        architecture: 'HybridSN-Standard',
        model_family: 'Hybrid-CNN',
        optimizer: 'Adam',
        learning_rate: 0.001,
        weight_decay: 0.0005,
        batch_size: 64,
        lr_scheduler: 'StepLR (step_size=15, gamma=0.5)',
        loss_function: 'CrossEntropyLoss',
        dropout: 0.4,
        epochs: 40,
        patch_size: 25,
      },
      results: {
        overall_accuracy: 97.10,
        average_accuracy: 95.84,
        cohens_kappa: 0.9669,
        macro_f1: 96.12,
        flops_gflops: 4.20,
        params_m: 5.12,
        inference_latency_ms: 9.8,
        training_duration_s: 182.0,
        peak_gpu_mem_mb: 3410,
      },
      epochs: hybridSnEpochs,
      confusion_matrix: hybridSnMatrix,
      class_names: INDIAN_PINES_CLASSES,
      per_class: calculatePerClassMetrics(hybridSnMatrix, INDIAN_PINES_CLASSES),
      diagnostics: diagnoseTrainingRun(hybridSnEpochs),
      artifacts: {
        checkpoint_url: '/artifacts/RUN-HSI-02/hybridsn_best.pt',
        log_file_name: 'hybridsn.log',
      },
      notes: 'Strong baseline. 3D convolutions extract rich features but 5.12M parameters create higher latency on edge deployment.',
    },
    {
      id: 'RUN-HSI-03',
      project_id: 'proj-indian-pines',
      name: 'SpectralFormer (Cross-Band ViT)',
      description: 'Hyperspectral transformer utilizing Group-wise Spectral Embedding and Cross-Layer Attention.',
      status: 'completed',
      created_at: '2026-10-20T09:40:00Z',
      completed_at: '2026-10-20T09:51:00Z',
      is_demo: true,
      metadata: {
        dataset: 'Indian Pines',
        dataset_type: 'hyperspectral',
        spatial_size: '9x9',
        spectral_bands: 200,
        classes_count: 16,
        split_method: 'Disjoint Spatial Sampling (10% train, 90% test)',
        preprocessing: ['StandardScaler', 'Band Grouping (20 sub-bands)'],
        seed: 42,
        code_commit: 'git-c891f0a',
        environment: 'PyTorch 2.4.0 + CUDA 12.4 (NVIDIA A100-SXM4-40GB)',
      },
      hyperparameters: {
        architecture: 'SpectralFormer-Base',
        model_family: 'Transformer',
        optimizer: 'AdamW',
        learning_rate: 0.0005,
        weight_decay: 0.01,
        batch_size: 64,
        lr_scheduler: 'CosineAnnealingLR',
        loss_function: 'CrossEntropyLoss',
        dropout: 0.2,
        epochs: 40,
        patch_size: 9,
      },
      results: {
        overall_accuracy: 96.35,
        average_accuracy: 94.70,
        cohens_kappa: 0.9583,
        macro_f1: 95.05,
        flops_gflops: 2.90,
        params_m: 1.95,
        inference_latency_ms: 7.1,
        training_duration_s: 142.0,
        peak_gpu_mem_mb: 3120,
      },
      epochs: spectralFormerEpochs,
      confusion_matrix: spectralFormerMatrix,
      class_names: INDIAN_PINES_CLASSES,
      per_class: calculatePerClassMetrics(spectralFormerMatrix, INDIAN_PINES_CLASSES),
      diagnostics: diagnoseTrainingRun(spectralFormerEpochs),
      artifacts: {
        checkpoint_url: '/artifacts/RUN-HSI-03/spectralformer.pt',
      },
      notes: 'Excellent spectral attention modeling. Suffers slight spatial boundary ambiguity on fine classes (e.g. Grass-pasture-mowed) due to smaller 9x9 patch window.',
    },
    {
      id: 'RUN-HSI-04',
      project_id: 'proj-indian-pines',
      name: '3D-CNN Baseline (Hamida et al.)',
      description: 'Classic 3D convolutional baseline with 4 volumetric conv blocks and dense classifier.',
      status: 'completed',
      created_at: '2026-10-21T11:00:00Z',
      completed_at: '2026-10-21T11:18:00Z',
      is_demo: true,
      metadata: {
        dataset: 'Indian Pines',
        dataset_type: 'hyperspectral',
        spatial_size: '11x11',
        spectral_bands: 200,
        classes_count: 16,
        split_method: 'Disjoint Spatial Sampling (10% train, 90% test)',
        preprocessing: ['StandardScaler'],
        seed: 42,
        code_commit: 'git-d4420ae',
        environment: 'PyTorch 2.4.0 + CUDA 12.4 (NVIDIA A100-SXM4-40GB)',
      },
      hyperparameters: {
        architecture: '3D-CNN-Hamida',
        model_family: '3D-CNN',
        optimizer: 'SGD (momentum=0.9)',
        learning_rate: 0.01,
        weight_decay: 0.0005,
        batch_size: 64,
        lr_scheduler: 'StepLR (step_size=20)',
        loss_function: 'CrossEntropyLoss',
        dropout: 0.5,
        epochs: 40,
        patch_size: 11,
      },
      results: {
        overall_accuracy: 91.50,
        average_accuracy: 88.20,
        cohens_kappa: 0.9030,
        macro_f1: 89.10,
        flops_gflops: 8.60,
        params_m: 12.40,
        inference_latency_ms: 18.5,
        training_duration_s: 245.0,
        peak_gpu_mem_mb: 4890,
      },
      epochs: cnn3dEpochs,
      confusion_matrix: cnn3dMatrix,
      class_names: INDIAN_PINES_CLASSES,
      per_class: calculatePerClassMetrics(cnn3dMatrix, INDIAN_PINES_CLASSES),
      diagnostics: diagnoseTrainingRun(cnn3dEpochs),
      artifacts: {
        checkpoint_url: '/artifacts/RUN-HSI-04/3dcnn.pt',
      },
      notes: 'High parameter count (12.4M) and slow inference without modern normalization techniques.',
    },
    {
      id: 'RUN-HSI-05',
      project_id: 'proj-indian-pines',
      name: 'ViT-Patch Baseline (Diagnostic Test Run)',
      description: 'Standard 2D Vision Transformer applied to PCA-reduced patches. Displays classic overfitting and training instability for diagnostic verification.',
      status: 'completed',
      created_at: '2026-10-22T16:00:00Z',
      completed_at: '2026-10-22T16:12:00Z',
      is_demo: true,
      metadata: {
        dataset: 'Indian Pines',
        dataset_type: 'hyperspectral',
        spatial_size: '15x15',
        spectral_bands: 200,
        classes_count: 16,
        split_method: 'Disjoint Spatial Sampling (10% train, 90% test)',
        preprocessing: ['PCA (3 components)'],
        seed: 1337,
        code_commit: 'git-e551f11',
        environment: 'PyTorch 2.4.0 + CUDA 12.4 (NVIDIA A100-SXM4-40GB)',
      },
      hyperparameters: {
        architecture: 'ViT-Small-Patch4',
        model_family: 'Transformer',
        optimizer: 'AdamW',
        learning_rate: 0.003,
        weight_decay: 0.0,
        batch_size: 128,
        lr_scheduler: 'None',
        loss_function: 'CrossEntropyLoss',
        dropout: 0.0,
        epochs: 40,
        patch_size: 15,
      },
      results: {
        overall_accuracy: 89.20,
        average_accuracy: 85.10,
        cohens_kappa: 0.8765,
        macro_f1: 86.40,
        flops_gflops: 3.40,
        params_m: 8.20,
        inference_latency_ms: 8.9,
        training_duration_s: 130.0,
        peak_gpu_mem_mb: 3200,
      },
      epochs: overfittedEpochs,
      confusion_matrix: overfittedMatrix,
      class_names: INDIAN_PINES_CLASSES,
      per_class: calculatePerClassMetrics(overfittedMatrix, INDIAN_PINES_CLASSES),
      diagnostics: diagnoseTrainingRun(overfittedEpochs),
      artifacts: {
        checkpoint_url: '/artifacts/RUN-HSI-05/vit_overfit.pt',
      },
      notes: 'Diagnostic demo run: Zero weight decay and excessive learning rate led to 10.6% generalization gap between train and validation accuracy.',
    },
  ];

  // 3. Pavia University Run
  const paviaMatrix: number[][] = [
    [6400, 15, 20, 8, 0, 5, 12, 10, 4],
    [10, 18200, 30, 25, 0, 15, 8, 12, 0],
    [12, 22, 2010, 5, 0, 8, 4, 15, 0],
    [5, 18, 4, 2980, 0, 12, 0, 5, 2],
    [0, 0, 0, 0, 1310, 0, 0, 0, 0],
    [4, 10, 8, 12, 0, 4890, 6, 8, 0],
    [8, 5, 2, 0, 0, 5, 1280, 10, 0],
    [15, 12, 10, 4, 0, 6, 8, 3620, 0],
    [2, 0, 0, 2, 0, 0, 0, 0, 930],
  ];
  const paviaEpochs = generateEpochs(30, 1.8, 0.02, 0.038, 99.8, 99.15);

  runs.push({
    id: 'RUN-PAV-01',
    project_id: 'proj-pavia-university',
    name: 'SSFTT-Pavia (ROSIS 103 Bands)',
    description: 'High-resolution urban land cover mapping using spectral-spatial feature tokenization.',
    status: 'completed',
    created_at: '2026-10-23T14:00:00Z',
    completed_at: '2026-10-23T14:15:00Z',
    is_demo: true,
    metadata: {
      dataset: 'Pavia University',
      dataset_type: 'hyperspectral',
      spatial_size: '13x13',
      spectral_bands: 103,
      classes_count: 9,
      split_method: 'Disjoint Spatial Sampling (10% train, 90% test)',
      preprocessing: ['StandardScaler', 'PCA (15 components)'],
      seed: 42,
    },
    hyperparameters: {
      architecture: 'SSFTT-Urban',
      model_family: 'Transformer',
      optimizer: 'AdamW',
      learning_rate: 0.001,
      weight_decay: 0.0001,
      batch_size: 64,
      lr_scheduler: 'CosineAnnealingLR',
      loss_function: 'CrossEntropyLoss',
      dropout: 0.3,
      epochs: 30,
      patch_size: 13,
    },
    results: {
      overall_accuracy: 99.15,
      average_accuracy: 98.70,
      cohens_kappa: 0.9887,
      macro_f1: 98.80,
      flops_gflops: 1.62,
      params_m: 0.58,
      inference_latency_ms: 3.9,
      training_duration_s: 92.0,
      peak_gpu_mem_mb: 2600,
    },
    epochs: paviaEpochs,
    confusion_matrix: paviaMatrix,
    class_names: PAVIA_U_CLASSES,
    per_class: calculatePerClassMetrics(paviaMatrix, PAVIA_U_CLASSES),
    diagnostics: diagnoseTrainingRun(paviaEpochs),
    artifacts: {
      checkpoint_url: '/artifacts/RUN-PAV-01/ssftt_pavia_best.pt',
    },
    notes: 'Exceptional urban accuracy. Painted metal sheets achieved 100% precision due to unique spectral signatures.',
  });

  // 4. Initial Reports
  const reports: ScientificReport[] = [
    {
      id: 'REP-2026-001',
      project_id: 'proj-indian-pines',
      title: 'Comparative Benchmark of Spectral-Spatial Transformers vs 3D-CNNs on AVIRIS Indian Pines',
      abstract: 'This report evaluates four deep learning architectures on the Indian Pines hyperspectral dataset under rigorous disjoint spatial sampling. SSFTT achieved the top Overall Accuracy (98.42%) and Kappa (0.9820) while maintaining an order of magnitude fewer parameters (0.58M) than conventional 3D-CNNs (12.40M).',
      created_at: '2026-10-24T12:00:00Z',
      compared_run_ids: ['RUN-HSI-01', 'RUN-HSI-02', 'RUN-HSI-03', 'RUN-HSI-04'],
      findings: [
        'SSFTT (RUN-HSI-01) dominates the Pareto efficiency curve with 98.42% OA at only 0.58M parameters and 1.84 GFLOPs.',
        'HybridSN (RUN-HSI-02) achieved competitive 97.10% OA but requires 8.8x more parameters (5.12M) and more than double the FLOPs.',
        'Classical 3D-CNN (RUN-HSI-04) exhibits severe compute inefficiency (8.6 GFLOPs, 18.5ms latency) without accuracy benefits.',
        'Transformer tokenization significantly improves rare-class recall on imbalanced targets such as Oats and Alfalfa.',
      ],
      latex_table: `\\begin{table*}[t]
\\centering
\\caption{Performance comparison on AVIRIS Indian Pines (10\\% training samples, disjoint split).}
\\label{tab:indian_pines_benchmark}
\\begin{tabular}{lcccccc}
\\hline
\\textbf{Model Architecture} & \\textbf{OA (\\%)} & \\textbf{AA (\\%)} & \\textbf{Kappa ($\\kappa$)} & \\textbf{Params (M)} & \\textbf{FLOPs (G)} & \\textbf{Latency (ms)} \\\\
\\hline
SSFTT (RUN-HSI-01) & \\textbf{98.42} & \\textbf{97.80} & \\textbf{0.9820} & \\textbf{0.58} & \\textbf{1.84} & \\textbf{4.2} \\\\
HybridSN (RUN-HSI-02) & 97.10 & 95.84 & 0.9669 & 5.12 & 4.20 & 9.8 \\\\
SpectralFormer (RUN-HSI-03) & 96.35 & 94.70 & 0.9583 & 1.95 & 2.90 & 7.1 \\\\
3D-CNN Baseline (RUN-HSI-04) & 91.50 & 88.20 & 0.9030 & 12.40 & 8.60 & 18.5 \\\\
\\hline
\\end{tabular}
\\end{table*}`,
      markdown_content: `# Comparative Benchmark on AVIRIS Indian Pines

## Executive Summary
Evaluation conducted across 4 runs under strictly identical experimental conditions (Seed: 42, Disjoint spatial split 10% train / 90% test, 200 calibrated AVIRIS bands).

| Model | OA (%) | AA (%) | Kappa | Params (M) | FLOPs (G) | Latency (ms) |
|---|---|---|---|---|---|---|
| **SSFTT** | **98.42** | **97.80** | **0.9820** | **0.58** | **1.84** | **4.2** |
| HybridSN | 97.10 | 95.84 | 0.9669 | 5.12 | 4.20 | 9.8 |
| SpectralFormer | 96.35 | 94.70 | 0.9583 | 1.95 | 2.90 | 7.1 |
| 3D-CNN | 91.50 | 88.20 | 0.9030 | 12.40 | 8.60 | 18.5 |

### Key Takeaway
SSFTT forms the single Pareto frontier point dominating all three baselines in both classification accuracy and compute budget.`,
      recommendations: [
        'Deploy SSFTT as the default backbone for remote sensing classification pipelines.',
        'Investigate spectral-spatial data augmentations to close the remaining 1.58% error gap.',
        'Evaluate 8-bit post-training quantization on SSFTT to assess latency on embedded UAV hardware.',
      ],
    },
  ];

  // 5. External Integrations status
  const integrations: IntegrationConfig[] = [
    {
      id: 'int-gdrive',
      name: 'Google Drive Artifact Sync',
      type: 'google_drive',
      status: 'disconnected',
      details: 'Sync model checkpoints (.pt, .onnx) and high-resolution classification maps directly to Google Drive.',
      config_fields: { clientId: '', clientSecret: '', rootFolder: 'DeepLab-Checkpoints' },
    },
    {
      id: 'int-colab',
      name: 'Google Colab Bridge',
      type: 'google_colab',
      status: 'configured',
      endpoint_url: '/api/runs/import',
      last_sync: '2026-10-25T14:00:00Z',
      details: 'One-line Colab logging snippet to stream epoch metrics and weights directly to DeepLab Analytics.',
      config_fields: { apiKey: 'dla_live_colab_8f23', projectDefault: 'proj-indian-pines' },
    },
    {
      id: 'int-pytorch',
      name: 'PyTorch Native Hook (torch.utils.tensorboard / custom)',
      type: 'pytorch_runtime',
      status: 'configured',
      endpoint_url: '/api/runs',
      last_sync: '2026-10-24T18:30:00Z',
      details: 'Python client callback library (deeplab_logger.py) for PyTorch Lightning and pure torch training scripts.',
      config_fields: { authToken: 'dla_pt_token_77a1', logFrequency: '1' },
    },
    {
      id: 'int-tensorboard',
      name: 'TensorBoard Event Log Parser',
      type: 'tensorboard',
      status: 'configured',
      details: 'Upload tfevents binary logs or exported scalar JSON to automatically visualize curves and diagnostics.',
      config_fields: { autoParseMetrics: 'true' },
    },
    {
      id: 'int-phd-lab',
      name: 'PhD-Research-Lab Agent Network',
      type: 'phd_research_lab',
      status: 'connected',
      endpoint_url: 'https://api.phd-research-lab.internal/v1',
      last_sync: '2026-10-26T22:15:00Z',
      details: 'Bi-directional synchronization of scientific hypotheses, literature links, and experimental results.',
      config_fields: { labNodeId: 'lab-node-asia-04', authMode: 'Bearer' },
    },
    {
      id: 'int-hermes',
      name: 'Hermes Agent Runtime',
      type: 'hermes_agent',
      status: 'connected',
      endpoint_url: 'http://localhost:8080/hermes/v2',
      last_sync: '2026-10-27T01:50:00Z',
      details: 'Autonomous experiment dispatcher capable of triggering ablation sweeps across GPU clusters.',
      config_fields: { clusterId: 'gpu-cluster-a100', concurrency: '4' },
    },
  ];

  return { projects, runs, reports, integrations };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse db file, re-initializing with seed data:', e);
        this.data = createSeedData();
        this.save();
      }
    } else {
      this.data = createSeedData();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save db to disk:', e);
    }
  }

  // Projects
  getProjects(): Project[] {
    return this.data.projects.map((p) => {
      const pRuns = this.data.runs.filter((r) => r.project_id === p.id);
      const bestOA = pRuns.length > 0 ? Math.max(...pRuns.map((r) => r.results.overall_accuracy)) : undefined;
      return {
        ...p,
        run_count: pRuns.length,
        best_oa: bestOA,
      };
    });
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  createProject(proj: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const newProject: Project = {
      ...proj,
      id: `proj-${Date.now().toString(36)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.projects.push(newProject);
    this.save();
    return newProject;
  }

  deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.data.runs = this.data.runs.filter((r) => r.project_id !== id);
    this.save();
    return this.data.projects.length < initialLen;
  }

  // Runs
  getRuns(projectId?: string, dataset?: string): ExperimentRun[] {
    let result = [...this.data.runs];
    if (projectId) {
      result = result.filter((r) => r.project_id === projectId);
    }
    if (dataset) {
      result = result.filter((r) => r.metadata.dataset.toLowerCase().includes(dataset.toLowerCase()));
    }
    return result;
  }

  getRun(id: string): ExperimentRun | undefined {
    return this.data.runs.find((r) => r.id === id);
  }

  createRun(runData: Omit<ExperimentRun, 'id' | 'created_at'> & { id?: string }): ExperimentRun {
    const runId = runData.id || `RUN-${Date.now().toString(36).toUpperCase()}`;

    // Calculate derived metrics if confusion matrix is provided
    let calculatedResults = { ...runData.results };
    let perClass = runData.per_class;

    if (runData.confusion_matrix && runData.confusion_matrix.length > 0) {
      const oa = calculateOverallAccuracy(runData.confusion_matrix);
      const aa = calculateAverageAccuracy(runData.confusion_matrix);
      const kappa = calculateCohensKappa(runData.confusion_matrix);

      calculatedResults.overall_accuracy = calculatedResults.overall_accuracy || oa;
      calculatedResults.average_accuracy = calculatedResults.average_accuracy || aa;
      calculatedResults.cohens_kappa = calculatedResults.cohens_kappa || kappa;

      if (!perClass && runData.class_names) {
        perClass = calculatePerClassMetrics(runData.confusion_matrix, runData.class_names);
      }
    }

    const diagnostics = diagnoseTrainingRun(runData.epochs || []);

    const newRun: ExperimentRun = {
      ...runData,
      id: runId,
      created_at: new Date().toISOString(),
      results: calculatedResults,
      per_class: perClass,
      diagnostics: diagnostics,
    };

    this.data.runs.unshift(newRun);
    this.save();
    return newRun;
  }

  updateRun(id: string, updates: Partial<ExperimentRun>): ExperimentRun | null {
    const idx = this.data.runs.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const existing = this.data.runs[idx];
    const updated = { ...existing, ...updates };

    if (updates.epochs) {
      updated.diagnostics = diagnoseTrainingRun(updates.epochs);
    }

    this.data.runs[idx] = updated;
    this.save();
    return updated;
  }

  deleteRun(id: string): boolean {
    const initialLen = this.data.runs.length;
    this.data.runs = this.data.runs.filter((r) => r.id !== id);
    this.save();
    return this.data.runs.length < initialLen;
  }

  // Reports
  getReports(projectId?: string): ScientificReport[] {
    if (projectId) {
      return this.data.reports.filter((r) => r.project_id === projectId);
    }
    return this.data.reports;
  }

  getReport(id: string): ScientificReport | undefined {
    return this.data.reports.find((r) => r.id === id);
  }

  createReport(reportData: Omit<ScientificReport, 'id' | 'created_at'>): ScientificReport {
    const newReport: ScientificReport = {
      ...reportData,
      id: `REP-${Date.now().toString(36).toUpperCase()}`,
      created_at: new Date().toISOString(),
    };
    this.data.reports.unshift(newReport);
    this.save();
    return newReport;
  }

  deleteReport(id: string): boolean {
    const initialLen = this.data.reports.length;
    this.data.reports = this.data.reports.filter((r) => r.id !== id);
    this.save();
    return this.data.reports.length < initialLen;
  }

  // Integrations
  getIntegrations(): IntegrationConfig[] {
    return this.data.integrations;
  }

  updateIntegration(id: string, updates: Partial<IntegrationConfig>): IntegrationConfig | null {
    const idx = this.data.integrations.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.data.integrations[idx] = { ...this.data.integrations[idx], ...updates };
    this.save();
    return this.data.integrations[idx];
  }
}

export const db = new Database();
