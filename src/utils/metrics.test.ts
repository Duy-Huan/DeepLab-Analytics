import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverallAccuracy,
  calculateAverageAccuracy,
  calculateCohensKappa,
  calculatePerClassMetrics,
  calculateParetoFrontier,
} from './metrics';
import { ExperimentRun } from '../types';

test('calculateOverallAccuracy computes exact diagonal ratio percentage', () => {
  // 3-class confusion matrix
  // Total = 50 + 30 + 25 = 105, Correct = 40 + 25 + 20 = 85 -> 85 / 105 = 80.95%
  const matrix = [
    [40, 5, 5],
    [3, 25, 2],
    [0, 5, 20],
  ];
  const oa = calculateOverallAccuracy(matrix);
  assert.equal(oa, 80.95);

  // Empty matrix
  assert.equal(calculateOverallAccuracy([]), 0);
});

test('calculateAverageAccuracy calculates mean per-class recall', () => {
  // Class 1: 40/50 = 80%
  // Class 2: 25/30 = 83.333%
  // Class 3: 20/25 = 80%
  // Mean = (80 + 83.3333 + 80) / 3 = 81.11%
  const matrix = [
    [40, 5, 5],
    [3, 25, 2],
    [0, 5, 20],
  ];
  const aa = calculateAverageAccuracy(matrix);
  assert.equal(aa, 81.11);
});

test('calculateCohensKappa computes accurate chance-corrected agreement', () => {
  // Perfect classification -> Kappa = 1.0000
  const perfectMatrix = [
    [50, 0],
    [0, 50],
  ];
  assert.equal(calculateCohensKappa(perfectMatrix), 1.0);

  // Realistic matrix
  const matrix = [
    [40, 5, 5],
    [3, 25, 2],
    [0, 5, 20],
  ];
  const kappa = calculateCohensKappa(matrix);
  assert.ok(kappa > 0.7 && kappa < 0.8, `Expected kappa ~0.76, got ${kappa}`);
});

test('calculatePerClassMetrics returns per-class precision, recall, and F1', () => {
  const matrix = [
    [30, 10],
    [5, 55],
  ];
  const classNames = ['Alfalfa', 'Corn'];
  const metrics = calculatePerClassMetrics(matrix, classNames);

  assert.equal(metrics.length, 2);
  assert.equal(metrics[0].class_name, 'Alfalfa');
  assert.equal(metrics[0].samples, 40); // 30 + 10
  assert.equal(metrics[0].correct, 30);
  assert.equal(metrics[0].recall, 75.0); // 30 / 40 * 100
  // Precision = 30 / 35 = 85.71%
  assert.equal(metrics[0].precision, 85.71);
});

test('calculateParetoFrontier correctly identifies non-dominated runs', () => {
  const dummyRuns: ExperimentRun[] = [
    {
      id: 'r1',
      project_id: 'p1',
      name: 'Model Heavy Accurate',
      status: 'completed',
      created_at: '2026-01-01',
      metadata: {} as any,
      hyperparameters: {} as any,
      results: {
        overall_accuracy: 98.5,
        average_accuracy: 97.0,
        cohens_kappa: 0.98,
        macro_f1: 97.5,
        params_m: 25.0, // heavy
      },
      epochs: [],
    },
    {
      id: 'r2',
      project_id: 'p1',
      name: 'Model Light Moderate',
      status: 'completed',
      created_at: '2026-01-01',
      metadata: {} as any,
      hyperparameters: {} as any,
      results: {
        overall_accuracy: 94.0,
        average_accuracy: 93.0,
        cohens_kappa: 0.93,
        macro_f1: 93.0,
        params_m: 1.2, // lightweight
      },
      epochs: [],
    },
    {
      id: 'r3',
      project_id: 'p1',
      name: 'Model Dominated',
      status: 'completed',
      created_at: '2026-01-01',
      metadata: {} as any,
      hyperparameters: {} as any,
      results: {
        overall_accuracy: 91.0,
        average_accuracy: 90.0,
        cohens_kappa: 0.90,
        macro_f1: 90.0,
        params_m: 28.0, // worse accuracy AND more params than r1
      },
      epochs: [],
    },
  ];

  // Maximizing overall_accuracy (higher better), minimizing params_m (lower better)
  const { paretoRuns, dominatedRuns } = calculateParetoFrontier(
    dummyRuns,
    'overall_accuracy',
    'params_m',
    true,  // OA higher is better
    false  // params lower is better
  );

  assert.equal(paretoRuns.length, 2);
  assert.ok(paretoRuns.some((r) => r.id === 'r1'));
  assert.ok(paretoRuns.some((r) => r.id === 'r2'));
  assert.equal(dominatedRuns.length, 1);
  assert.equal(dominatedRuns[0].id, 'r3');
});
