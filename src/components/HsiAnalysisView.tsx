import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Boxes,
  Grid,
  Info,
  Layers,
  Database,
  BarChart3,
  Sliders,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const HSI_DATASET_SPECS: Record<
  string,
  {
    sensor: string;
    bands: number;
    classes: number;
    spatial_res: string;
    spectral_range: string;
    description: string;
    class_names: string[];
  }
> = {
  'Indian Pines': {
    sensor: 'AVIRIS (Airborne Visible / Infrared Imaging Spectrometer)',
    bands: 200, // calibrated (24 water absorption bands removed: 104-108, 150-163, 220)
    classes: 16,
    spatial_res: '20 meters / pixel (145 x 145)',
    spectral_range: '0.4 – 2.5 µm (continuous)',
    description:
      'Northwestern Indiana agricultural test site with severe class imbalance (Oats: 20 samples vs Soybean: 2210 samples) and high inter-class spectral similarity.',
    class_names: [
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
    ],
  },
  'Pavia University': {
    sensor: 'ROSIS (Reflective Optics System Imaging Spectrometer)',
    bands: 103, // 12 noisy bands removed
    classes: 9,
    spatial_res: '1.3 meters / pixel (610 x 340)',
    spectral_range: '0.43 – 0.86 µm',
    description:
      'Urban flight over the University of Pavia, Italy. High spatial resolution with fine urban land-cover geometries and distinct man-made spectral signatures.',
    class_names: [
      'Asphalt',
      'Meadows',
      'Gravel',
      'Trees',
      'Painted metal sheets',
      'Bare Soil',
      'Bitumen',
      'Self-Blocking Bricks',
      'Shadows',
    ],
  },
  'Salinas': {
    sensor: 'AVIRIS',
    bands: 204,
    classes: 16,
    spatial_res: '3.7 meters / pixel (512 x 217)',
    spectral_range: '0.4 – 2.5 µm',
    description:
      'Salinas Valley, California. Agricultural scene with high spatial continuity across orderly fields including broccoli, celery, and vineyards.',
    class_names: [
      'Broccoli_green_weeds_1',
      'Broccoli_green_weeds_2',
      'Fallow',
      'Fallow_rough_plow',
      'Fallow_smooth',
      'Stubble',
      'Celery',
      'Grapes_untrained',
      'Soil_vinyard_develop',
      'Corn_senesced_green_weeds',
      'Lettuce_romaine_4wk',
      'Lettuce_romaine_5wk',
      'Lettuce_romaine_6wk',
      'Lettuce_romaine_7wk',
      'Vinyard_untrained',
      'Vinyard_vertical_trellis',
    ],
  },
  'Houston 2013': {
    sensor: 'CASI (Compact Airborne Spectrographic Imager)',
    bands: 144,
    classes: 15,
    spatial_res: '2.5 meters / pixel (349 x 1905)',
    spectral_range: '380 – 1050 nm',
    description:
      'University of Houston campus and urban surroundings acquired during the IEEE GRSS Data Fusion Contest.',
    class_names: [
      'Healthy grass',
      'Stressed grass',
      'Synthetic grass',
      'Trees',
      'Soil',
      'Water',
      'Residential',
      'Commercial',
      'Road',
      'Highway',
      'Railway',
      'Parking Lot 1',
      'Parking Lot 2',
      'Tennis Court',
      'Running Track',
    ],
  },
};

export default function HsiAnalysisView() {
  const { runs, inspectRunId, setInspectRunId, setActiveTab } = useApp();

  const [selectedDataset, setSelectedDataset] = useState<string>('Indian Pines');
  const datasetSpec = HSI_DATASET_SPECS[selectedDataset] || HSI_DATASET_SPECS['Indian Pines'];

  // Runs matching this dataset
  const datasetRuns = runs.filter((r) =>
    r.metadata.dataset.toLowerCase().includes(selectedDataset.toLowerCase())
  );

  const activeRun = runs.find((r) => r.id === inspectRunId) || datasetRuns[0] || runs[0];
  const matrix = activeRun?.confusion_matrix || [];
  const classNames = activeRun?.class_names || datasetSpec.class_names;
  const perClass = activeRun?.per_class || [];

  const [hoveredCell, setHoveredCell] = useState<{ actual: number; pred: number; count: number } | null>(null);

  // Find max value in matrix for heatmap scaling
  let maxCellVal = 1;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] > maxCellVal) maxCellVal = matrix[i][j];
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-emerald-500" />
            <span>Hyperspectral Image Research Domain Center</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Domain-specific evaluation of narrow-band spectral cubes, disjoint spatial splits, and per-class confusion.
          </p>
        </div>

        {/* Dataset Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-medium">
          {Object.keys(HSI_DATASET_SPECS).map((ds) => (
            <button
              key={ds}
              onClick={() => setSelectedDataset(ds)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedDataset === ds
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {ds}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Specification Card */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              {selectedDataset} Benchmark Specification
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              {datasetSpec.bands} Calibrated Bands
            </span>
          </div>
          <span className="text-xs font-mono text-gray-400">
            {datasetSpec.classes} Ground Truth Classes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
            <span className="text-gray-400 block text-[10px]">Sensor & Imager:</span>
            <span className="font-semibold text-gray-800 dark:text-zinc-200 mt-1 block">
              {datasetSpec.sensor}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
            <span className="text-gray-400 block text-[10px]">Spectral Range:</span>
            <span className="font-semibold text-gray-800 dark:text-zinc-200 mt-1 block">
              {datasetSpec.spectral_range}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
            <span className="text-gray-400 block text-[10px]">Spatial Resolution:</span>
            <span className="font-semibold text-gray-800 dark:text-zinc-200 mt-1 block">
              {datasetSpec.spatial_res}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
            <span className="text-gray-400 block text-[10px]">Split Integrity:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
              Disjoint Partitioning (Zero Leakage)
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-sans">
          {datasetSpec.description}
        </p>
      </div>

      {/* Model Run Active for Matrix */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 font-medium">Inspecting Model Run:</span>
          <select
            value={activeRun?.id || ''}
            onChange={(e) => setInspectRunId(e.target.value)}
            className="font-bold bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-2.5 py-1 text-gray-900 dark:text-zinc-100 focus:outline-none"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.name} ({r.results.overall_accuracy}% OA)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4 font-mono font-bold">
          <span className="text-emerald-600 dark:text-emerald-400">
            OA: {activeRun?.results.overall_accuracy.toFixed(2)}%
          </span>
          <span className="text-blue-600 dark:text-blue-400">
            AA: {activeRun?.results.average_accuracy.toFixed(2)}%
          </span>
          <span className="text-purple-600 dark:text-purple-400">
            κ: {activeRun?.results.cohens_kappa.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Interactive Confusion Matrix Heatmap */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Interactive Confusion Matrix ({matrix.length} × {matrix.length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Hover cell to inspect actual vs predicted pixel counts
          </span>
        </div>

        {matrix.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No confusion matrix recorded for this run.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              <div className="grid gap-[2px]" style={{ gridTemplateColumns: `80px repeat(${matrix.length}, minmax(36px, 1fr))` }}>
                {/* Header row */}
                <div className="text-[9px] font-mono font-bold text-gray-400 text-right pr-2">Actual \ Pred</div>
                {classNames.slice(0, matrix.length).map((cn, idx) => (
                  <div
                    key={idx}
                    className="text-[9px] font-mono text-center text-gray-500 dark:text-zinc-400 truncate px-0.5"
                    title={`C${idx + 1}: ${cn}`}
                  >
                    C{idx + 1}
                  </div>
                ))}

                {/* Matrix rows */}
                {matrix.map((row, i) => (
                  <React.Fragment key={i}>
                    {/* Row label */}
                    <div
                      className="text-[9px] font-mono text-gray-600 dark:text-zinc-400 font-semibold truncate pr-2 text-right"
                      title={`C${i + 1}: ${classNames[i]}`}
                    >
                      C{i + 1}
                    </div>

                    {/* Cells */}
                    {row.map((val, j) => {
                      const isDiagonal = i === j;
                      const ratio = val / maxCellVal;
                      const intensity = Math.min(1, Math.pow(ratio, 0.4));

                      return (
                        <div
                          key={j}
                          onMouseEnter={() => setHoveredCell({ actual: i, pred: j, count: val })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{
                            backgroundColor: isDiagonal
                              ? `rgba(16, 185, 129, ${Math.max(0.2, intensity)})`
                              : val > 0
                              ? `rgba(239, 68, 68, ${Math.max(0.15, intensity * 0.8)})`
                              : undefined,
                          }}
                          className={`h-9 flex items-center justify-center font-mono text-[10px] rounded-xs cursor-pointer transition-transform hover:scale-110 hover:z-10 hover:shadow-md ${
                            val === 0
                              ? 'bg-gray-50 dark:bg-zinc-800/40 text-gray-300 dark:text-zinc-600'
                              : isDiagonal
                              ? 'text-emerald-950 dark:text-emerald-100 font-bold'
                              : 'text-red-950 dark:text-red-200 font-semibold'
                          }`}
                        >
                          {val > 0 ? val : 0}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hovered cell tooltip bar */}
        <div className="h-6 flex items-center text-xs font-mono">
          {hoveredCell ? (
            <div className="flex items-center space-x-3 text-gray-700 dark:text-zinc-300">
              <span>
                <strong>Ground Truth:</strong> C{hoveredCell.actual + 1} ({classNames[hoveredCell.actual]})
              </span>
              <span>→</span>
              <span>
                <strong>Predicted:</strong> C{hoveredCell.pred + 1} ({classNames[hoveredCell.pred]})
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                Count: {hoveredCell.count} pixels
              </span>
              {hoveredCell.actual === hoveredCell.pred ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Correct Classification</span>
              ) : (
                <span className="text-red-500 font-semibold">✗ Misclassification Confusion</span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-[11px]">Hover over matrix cells to inspect class-pair details.</span>
          )}
        </div>
      </div>

      {/* Per-Class Performance Table */}
      {perClass.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Per-Class Classification Breakdown
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Recall, Precision, and F1 per spectral target
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-800 text-[10px] text-gray-500 uppercase">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3 font-sans">Class Name</th>
                  <th className="p-3 text-right">Test Samples</th>
                  <th className="p-3 text-right">Correct (TP)</th>
                  <th className="p-3 text-right">Class Accuracy / Recall</th>
                  <th className="p-3 text-right">Precision</th>
                  <th className="p-3 text-right">F1-Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {perClass.map((c) => {
                  const isLow = c.accuracy < 90;
                  return (
                    <tr key={c.class_id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 text-gray-400">{c.class_id}</td>
                      <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">
                        {c.class_name}
                      </td>
                      <td className="p-3 text-right">{c.samples}</td>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{c.correct}</td>
                      <td className="p-3 text-right">
                        <span className={isLow ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                          {c.accuracy.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right">{c.precision.toFixed(2)}%</td>
                      <td className="p-3 text-right font-semibold">{c.f1.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
