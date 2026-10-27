import { ClassPerformance, ExperimentRun } from '../types';

/**
 * Calculates Overall Accuracy (OA) from confusion matrix.
 * OA = (Sum of diagonal elements) / (Total sum of matrix) * 100
 */
export function calculateOverallAccuracy(matrix: number[][]): number {
  if (!matrix || matrix.length === 0) return 0;
  let correct = 0;
  let total = 0;

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const val = matrix[i][j];
      total += val;
      if (i === j) {
        correct += val;
      }
    }
  }

  if (total === 0) return 0;
  return Number(((correct / total) * 100).toFixed(2));
}

/**
 * Calculates Average Accuracy (AA) across all classes.
 * AA = Mean of per-class recall (accuracy per class) * 100
 */
export function calculateAverageAccuracy(matrix: number[][]): number {
  if (!matrix || matrix.length === 0) return 0;
  const numClasses = matrix.length;
  let classAccuraciesSum = 0;
  let validClasses = 0;

  for (let i = 0; i < numClasses; i++) {
    let rowSum = 0;
    for (let j = 0; j < matrix[i].length; j++) {
      rowSum += matrix[i][j];
    }
    if (rowSum > 0) {
      const classAcc = matrix[i][i] / rowSum;
      classAccuraciesSum += classAcc;
      validClasses++;
    }
  }

  if (validClasses === 0) return 0;
  return Number(((classAccuraciesSum / validClasses) * 100).toFixed(2));
}

/**
 * Calculates Cohen's Kappa Coefficient (Kappa, κ).
 * Kappa = (P_o - P_e) / (1 - P_e)
 * Where P_o = observed accuracy, P_e = expected accuracy by chance
 */
export function calculateCohensKappa(matrix: number[][]): number {
  if (!matrix || matrix.length === 0) return 0;
  const numClasses = matrix.length;
  let total = 0;
  let correct = 0;

  const rowSums: number[] = new Array(numClasses).fill(0);
  const colSums: number[] = new Array(numClasses).fill(0);

  for (let i = 0; i < numClasses; i++) {
    for (let j = 0; j < numClasses; j++) {
      const val = matrix[i][j];
      total += val;
      rowSums[i] += val;
      colSums[j] += val;
      if (i === j) {
        correct += val;
      }
    }
  }

  if (total === 0) return 0;

  const p0 = correct / total;
  let pe = 0;
  for (let i = 0; i < numClasses; i++) {
    pe += (rowSums[i] * colSums[i]) / (total * total);
  }

  if (pe >= 1) return 1.0;
  const kappa = (p0 - pe) / (1 - pe);
  return Number(Math.max(-1, Math.min(1, kappa)).toFixed(4));
}

/**
 * Calculates per-class metrics (samples, accuracy, precision, recall, f1)
 */
export function calculatePerClassMetrics(
  matrix: number[][],
  classNames: string[]
): ClassPerformance[] {
  if (!matrix || matrix.length === 0) return [];
  const numClasses = matrix.length;
  const results: ClassPerformance[] = [];

  const rowSums: number[] = new Array(numClasses).fill(0); // Ground truth counts
  const colSums: number[] = new Array(numClasses).fill(0); // Predicted counts

  for (let i = 0; i < numClasses; i++) {
    for (let j = 0; j < numClasses; j++) {
      rowSums[i] += matrix[i][j];
      colSums[j] += matrix[i][j];
    }
  }

  for (let i = 0; i < numClasses; i++) {
    const tp = matrix[i][i];
    const totalActual = rowSums[i];
    const totalPredicted = colSums[i];

    const recall = totalActual > 0 ? tp / totalActual : 0;
    const precision = totalPredicted > 0 ? tp / totalPredicted : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const accuracy = recall * 100;

    results.push({
      class_id: i + 1,
      class_name: classNames[i] || `Class ${i + 1}`,
      samples: totalActual,
      correct: tp,
      accuracy: Number(accuracy.toFixed(2)),
      precision: Number((precision * 100).toFixed(2)),
      recall: Number((recall * 100).toFixed(2)),
      f1: Number((f1 * 100).toFixed(2)),
    });
  }

  return results;
}

/**
 * Computes Pareto-optimal frontier runs given two objectives
 * e.g., maximizing OA while minimizing parameter count or FLOPs.
 */
export function calculateParetoFrontier(
  runs: ExperimentRun[],
  xKey: keyof ExperimentRun['results'],
  yKey: keyof ExperimentRun['results'],
  xHigherIsBetter: boolean = true,
  yHigherIsBetter: boolean = true
): { paretoRuns: ExperimentRun[]; dominatedRuns: ExperimentRun[] } {
  const validRuns = runs.filter((r) => r.results[xKey] != null && r.results[yKey] != null);

  const paretoRuns: ExperimentRun[] = [];
  const dominatedRuns: ExperimentRun[] = [];

  for (const candidate of validRuns) {
    const cX = candidate.results[xKey] as number;
    const cY = candidate.results[yKey] as number;
    let isDominated = false;

    for (const other of validRuns) {
      if (other.id === candidate.id) continue;
      const oX = other.results[xKey] as number;
      const oY = other.results[yKey] as number;

      const betterOrEqualX = xHigherIsBetter ? oX >= cX : oX <= cX;
      const betterOrEqualY = yHigherIsBetter ? oY >= cY : oY <= cY;
      const strictlyBetterX = xHigherIsBetter ? oX > cX : oX < cX;
      const strictlyBetterY = yHigherIsBetter ? oY > cY : oY < cY;

      if (betterOrEqualX && betterOrEqualY && (strictlyBetterX || strictlyBetterY)) {
        isDominated = true;
        break;
      }
    }

    if (isDominated) {
      dominatedRuns.push(candidate);
    } else {
      paretoRuns.push(candidate);
    }
  }

  return { paretoRuns, dominatedRuns };
}
