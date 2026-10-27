import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseTrainingRun } from './diagnostics';
import { EpochMetric } from '../types';

test('diagnoseTrainingRun detects overfitting when val loss rises and train/val accuracy gap widens', () => {
  const epochs: EpochMetric[] = [
    { epoch: 1, train_loss: 1.2, val_loss: 1.3, train_oa: 60, val_oa: 58, learning_rate: 0.001 },
    { epoch: 2, train_loss: 0.8, val_loss: 0.9, train_oa: 75, val_oa: 73, learning_rate: 0.001 },
    { epoch: 3, train_loss: 0.5, val_loss: 0.7, train_oa: 88, val_oa: 82, learning_rate: 0.001 },
    { epoch: 4, train_loss: 0.3, val_loss: 0.8, train_oa: 94, val_oa: 81, learning_rate: 0.001 },
    { epoch: 5, train_loss: 0.15, val_loss: 0.95, train_oa: 98, val_oa: 80, learning_rate: 0.001 },
    { epoch: 6, train_loss: 0.08, val_loss: 1.15, train_oa: 99.5, val_oa: 79, learning_rate: 0.001 },
  ];

  const alerts = diagnoseTrainingRun(epochs);
  const overfit = alerts.find((a) => a.type === 'overfitting');
  assert.ok(overfit, 'Expected overfitting alert');
  assert.equal(overfit.severity, 'high');
  assert.ok(overfit.observed_evidence.includes('gap'));
});

test('diagnoseTrainingRun detects data leakage risk if epoch 1 validation accuracy is abnormally high', () => {
  const epochs: EpochMetric[] = [
    { epoch: 1, train_loss: 0.02, val_loss: 0.03, train_oa: 99.1, val_oa: 98.8, learning_rate: 0.001 },
    { epoch: 2, train_loss: 0.01, val_loss: 0.02, train_oa: 99.5, val_oa: 99.2, learning_rate: 0.001 },
    { epoch: 3, train_loss: 0.008, val_loss: 0.015, train_oa: 99.8, val_oa: 99.5, learning_rate: 0.001 },
  ];

  const alerts = diagnoseTrainingRun(epochs);
  const leakage = alerts.find((a) => a.type === 'leakage_risk');
  assert.ok(leakage, 'Expected leakage risk alert');
  assert.equal(leakage.severity, 'high');
});

test('diagnoseTrainingRun detects training loss divergence', () => {
  const epochs: EpochMetric[] = [
    { epoch: 1, train_loss: 0.8, val_loss: 0.9, train_oa: 70, val_oa: 68, learning_rate: 0.01 },
    { epoch: 2, train_loss: 250.0, val_loss: 300.0, train_oa: 10, val_oa: 10, learning_rate: 0.01 },
    { epoch: 3, train_loss: NaN, val_loss: NaN, train_oa: 10, val_oa: 10, learning_rate: 0.01 },
  ];

  const alerts = diagnoseTrainingRun(epochs);
  const divergence = alerts.find((a) => a.type === 'divergence');
  assert.ok(divergence, 'Expected divergence alert');
});

test('diagnoseTrainingRun returns healthy status for normal smooth convergence', () => {
  const epochs: EpochMetric[] = [
    { epoch: 1, train_loss: 1.5, val_loss: 1.4, train_oa: 50, val_oa: 52, learning_rate: 0.001 },
    { epoch: 2, train_loss: 1.0, val_loss: 0.95, train_oa: 70, val_oa: 71, learning_rate: 0.001 },
    { epoch: 3, train_loss: 0.6, val_loss: 0.58, train_oa: 82, val_oa: 83, learning_rate: 0.0008 },
    { epoch: 4, train_loss: 0.35, val_loss: 0.36, train_oa: 90, val_oa: 89.5, learning_rate: 0.0005 },
    { epoch: 5, train_loss: 0.2, val_loss: 0.22, train_oa: 94.5, val_oa: 94.0, learning_rate: 0.0002 },
  ];

  const alerts = diagnoseTrainingRun(epochs);
  const healthy = alerts.find((a) => a.type === 'healthy');
  assert.ok(healthy, 'Expected healthy status alert');
});
