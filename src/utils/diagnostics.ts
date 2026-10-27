import { DiagnosticAlert, EpochMetric } from '../types';

/**
 * Deterministic Diagnostic Engine for Deep Learning Training Curves.
 * Analyzes epoch metrics to identify overfitting, underfitting, instability,
 * divergence, plateauing, and potential data leakage.
 */
export function diagnoseTrainingRun(epochs: EpochMetric[]): DiagnosticAlert[] {
  const alerts: DiagnosticAlert[] = [];
  if (!epochs || epochs.length < 3) {
    alerts.push({
      type: 'healthy',
      severity: 'info',
      title: 'Insufficient Epoch Data',
      observed_evidence: `Run contains ${epochs ? epochs.length : 0} epochs (minimum 3 required for trend diagnosis).`,
      derived_calculation: 'N/A',
      recommendation: 'Train for at least 5-10 epochs to observe metric convergence curves.',
    });
    return alerts;
  }

  const n = epochs.length;
  const firstEpoch = epochs[0];
  const lastEpoch = epochs[n - 1];

  // 1. Potential Data Leakage Risk (especially critical in Hyperspectral and patch-based CV)
  if (firstEpoch.val_oa >= 98.0 && firstEpoch.train_oa >= 98.0) {
    alerts.push({
      type: 'leakage_risk',
      severity: 'high',
      title: 'Suspiciously High Initial Validation Accuracy (Possible Data Leakage)',
      epoch_range: [1, 2],
      observed_evidence: `Epoch 1 achieved Val OA of ${firstEpoch.val_oa.toFixed(2)}% and Train OA of ${firstEpoch.train_oa.toFixed(2)}%.`,
      derived_calculation: `Val OA >= 98.0% on epoch 1 prior to representation convergence.`,
      recommendation: 'Verify train/test spatial partitioning. In hyperspectral datasets, random pixel sampling produces overlapping spatial patches. Use disjoint spatial blocks (e.g. 5x5 spatial buffer or split by polygon/region).',
    });
  }

  // 2. Divergence (NaN, Infinity, or explosion)
  const divergentEpoch = epochs.find(
    (e) => !Number.isFinite(e.train_loss) || !Number.isFinite(e.val_loss) || e.train_loss > 100
  );
  if (divergentEpoch) {
    alerts.push({
      type: 'divergence',
      severity: 'high',
      title: 'Numerical Divergence / Loss Explosion Detected',
      epoch_range: [divergentEpoch.epoch, divergentEpoch.epoch],
      observed_evidence: `Loss exceeded finite stability threshold at epoch ${divergentEpoch.epoch} (train_loss: ${divergentEpoch.train_loss}, val_loss: ${divergentEpoch.val_loss}).`,
      derived_calculation: 'Non-finite or extreme loss values detected.',
      recommendation: 'Reduce initial learning rate by 5x-10x, apply gradient clipping (e.g. max_norm=1.0), and check for numerical instability in loss function (e.g. log(0) in CrossEntropy without epsilon).',
    });
  }

  // 3. Overfitting Analysis
  // Check if val_loss consistently increases over the last 3-5 epochs while train_loss decreases
  let valLossIncreases = 0;
  let trainLossDecreases = 0;
  const window = Math.min(5, Math.floor(n / 2));
  const recentEpochs = epochs.slice(n - window);

  for (let i = 1; i < recentEpochs.length; i++) {
    if (recentEpochs[i].val_loss > recentEpochs[i - 1].val_loss) valLossIncreases++;
    if (recentEpochs[i].train_loss < recentEpochs[i - 1].train_loss) trainLossDecreases++;
  }

  const accuracyGap = lastEpoch.train_oa - lastEpoch.val_oa;
  const isOverfittingLoss = valLossIncreases >= window - 1 && trainLossDecreases >= window - 2;
  const isOverfittingGap = accuracyGap > 8.0 && lastEpoch.train_oa > 90.0;

  if (isOverfittingLoss || isOverfittingGap) {
    alerts.push({
      type: 'overfitting',
      severity: isOverfittingLoss && isOverfittingGap ? 'high' : 'medium',
      title: 'Generalization Gap & Overfitting Detected',
      epoch_range: [epochs[n - window].epoch, lastEpoch.epoch],
      observed_evidence: `Final Train OA is ${lastEpoch.train_oa.toFixed(2)}% vs Val OA of ${lastEpoch.val_oa.toFixed(2)}% (gap: +${accuracyGap.toFixed(2)}%). Validation loss rose in ${valLossIncreases} of the last ${window - 1} observed epoch transitions.`,
      derived_calculation: `Accuracy generalization gap: Δ = ${accuracyGap.toFixed(2)}% > 8.0% threshold.`,
      recommendation: 'Introduce stronger regularization: increase weight decay (e.g. 1e-4 -> 1e-3), increase dropout (e.g. 0.3 -> 0.5), use label smoothing, or apply spectral-spatial data augmentations (spectral jittering, random erasing).',
    });
  }

  // 4. Underfitting Analysis
  if (lastEpoch.train_oa < 65.0 && lastEpoch.val_oa < 65.0 && n >= 10) {
    alerts.push({
      type: 'underfitting',
      severity: 'high',
      title: 'Persistent Underfitting / Low Capacity',
      epoch_range: [1, lastEpoch.epoch],
      observed_evidence: `After ${n} epochs, Train OA reached only ${lastEpoch.train_oa.toFixed(2)}% and Val OA reached ${lastEpoch.val_oa.toFixed(2)}%.`,
      derived_calculation: `Train OA < 65.0% and Val OA < 65.0% at epoch ${n}.`,
      recommendation: 'Increase model capacity (depth, channel dimensions, attention heads), lower weight decay, or check if learning rate is too low or optimizer schedule drops too quickly.',
    });
  }

  // 5. Training Instability (Loss Variance Spikes)
  let maxSpikeFactor = 0;
  let spikeEpoch = 0;
  for (let i = 1; i < epochs.length; i++) {
    const prev = epochs[i - 1].val_loss;
    const curr = epochs[i].val_loss;
    if (prev > 0.05 && curr > prev) {
      const ratio = curr / prev;
      if (ratio > maxSpikeFactor) {
        maxSpikeFactor = ratio;
        spikeEpoch = epochs[i].epoch;
      }
    }
  }

  if (maxSpikeFactor >= 2.5) {
    alerts.push({
      type: 'instability',
      severity: maxSpikeFactor > 4.0 ? 'high' : 'medium',
      title: 'Validation Loss Spikes / Training Instability',
      epoch_range: [spikeEpoch - 1, spikeEpoch],
      observed_evidence: `Validation loss surged by ${(maxSpikeFactor * 100 - 100).toFixed(1)}% at epoch ${spikeEpoch}.`,
      derived_calculation: `Loss surge factor = ${maxSpikeFactor.toFixed(2)}x exceeds 2.5x threshold.`,
      recommendation: 'Apply learning rate warmup (e.g. 5 epochs), reduce peak learning rate, verify batch normalization momentum, or increase batch size to reduce gradient noise.',
    });
  }

  // 6. Plateauing (Convergence or Early Stopping opportunity)
  const plateauWindow = Math.min(8, Math.floor(n / 3));
  if (plateauWindow >= 4) {
    const tail = epochs.slice(n - plateauWindow);
    const maxValOA = Math.max(...tail.map((e) => e.val_oa));
    const minValOA = Math.min(...tail.map((e) => e.val_oa));
    const delta = maxValOA - minValOA;

    if (delta <= 0.25 && lastEpoch.val_oa > 75) {
      alerts.push({
        type: 'plateau',
        severity: 'info',
        title: 'Validation Metric Plateau Reached',
        epoch_range: [epochs[n - plateauWindow].epoch, lastEpoch.epoch],
        observed_evidence: `Validation accuracy fluctuated by only ${delta.toFixed(3)}% over the last ${plateauWindow} epochs.`,
        derived_calculation: `Max ΔValOA = ${delta.toFixed(3)}% <= 0.25% across ${plateauWindow} epochs.`,
        recommendation: 'Model has converged. You can employ early stopping with patience=5 to save GPU compute hours, or decrease learning rate with a cosine decay to explore finer minima.',
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'healthy',
      severity: 'info',
      title: 'Smooth Convergence & Healthy Generalization',
      observed_evidence: `Train loss consistently decreased to ${lastEpoch.train_loss.toFixed(4)}, Val OA reached ${lastEpoch.val_oa.toFixed(2)}% with minimal generalization gap (${accuracyGap.toFixed(2)}%).`,
      derived_calculation: 'All deterministic sanity criteria passed.',
      recommendation: 'Training dynamics appear stable and healthy for publication.',
    });
  }

  return alerts;
}
