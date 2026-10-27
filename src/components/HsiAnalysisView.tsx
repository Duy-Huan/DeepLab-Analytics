import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Boxes,
  Grid,
  Info,
  Download,
  Image as ImageIcon,
  Palette,
  Sparkles,
} from 'lucide-react';
import { ACADEMIC_STYLES, AcademicStyle, exportSvgAsFile, exportSvgAsPng } from '../utils/exportFigure';

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
    bands: 200,
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
    bands: 103,
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
  const { runs, inspectRunId, setInspectRunId, toast } = useApp();

  const [selectedDataset, setSelectedDataset] = useState<string>('Indian Pines');
  const [academicStyle, setAcademicStyle] = useState<AcademicStyle>('ieee');
  const [exporting, setExporting] = useState(false);
  const matrixSvgRef = useRef<SVGSVGElement | null>(null);

  const datasetSpec = HSI_DATASET_SPECS[selectedDataset] || HSI_DATASET_SPECS['Indian Pines'];
  const styleConfig = ACADEMIC_STYLES[academicStyle];

  const datasetRuns = runs.filter((r) =>
    r.metadata.dataset.toLowerCase().includes(selectedDataset.toLowerCase())
  );

  const activeRun = runs.find((r) => r.id === inspectRunId) || datasetRuns[0] || runs[0];
  const matrix = activeRun?.confusion_matrix || [];
  const classNames = activeRun?.class_names || datasetSpec.class_names;
  const perClass = activeRun?.per_class || [];

  const [hoveredCell, setHoveredCell] = useState<{ actual: number; pred: number; count: number } | null>(null);

  let maxCellVal = 1;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] > maxCellVal) maxCellVal = matrix[i][j];
    }
  }

  const handleExportSVG = () => {
    if (!matrixSvgRef.current) return;
    const filename = `${activeRun?.name.replace(/\s+/g, '_')}_confusion_matrix_${academicStyle}`;
    exportSvgAsFile(matrixSvgRef.current, filename);
    toast(`Exported confusion matrix as ${filename}.svg`, 'success');
  };

  const handleExportPNG = async () => {
    if (!matrixSvgRef.current) return;
    try {
      setExporting(true);
      const filename = `${activeRun?.name.replace(/\s+/g, '_')}_confusion_matrix_${academicStyle}`;
      await exportSvgAsPng(matrixSvgRef.current, filename, 3.0);
      toast(`Exported 300 DPI publication confusion matrix (${filename}_300dpi.png)`, 'success');
    } catch (err: any) {
      toast('Failed to render PNG export', 'error');
    } finally {
      setExporting(false);
    }
  };

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
          <span className="text-xs font-mono text-gray-500 dark:text-zinc-400">
            {datasetSpec.classes} Ground Truth Classes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800">
            <span className="text-gray-500 dark:text-zinc-400 block text-[10px]">Sensor & Imager:</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-200 mt-1 block">
              {datasetSpec.sensor}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800">
            <span className="text-gray-500 dark:text-zinc-400 block text-[10px]">Spectral Range:</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-200 mt-1 block">
              {datasetSpec.spectral_range}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800">
            <span className="text-gray-500 dark:text-zinc-400 block text-[10px]">Spatial Resolution:</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-200 mt-1 block">
              {datasetSpec.spatial_res}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-800">
            <span className="text-gray-500 dark:text-zinc-400 block text-[10px]">Split Integrity:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
              Disjoint Partitioning (Zero Leakage)
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-sans">
          {datasetSpec.description}
        </p>
      </div>

      {/* Model Run Active for Matrix & Academic Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 dark:text-zinc-400 font-medium">Inspecting Model:</span>
          <select
            value={activeRun?.id || ''}
            onChange={(e) => setInspectRunId(e.target.value)}
            className="font-bold bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-2.5 py-1 text-gray-900 dark:text-zinc-100 focus:outline-none"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.name} ({r.results.overall_accuracy}% OA)
              </option>
            ))}
          </select>
        </div>

        {/* Academic Style Picker & Export Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={academicStyle}
              onChange={(e) => setAcademicStyle(e.target.value as AcademicStyle)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-800 dark:text-zinc-200 font-medium"
            >
              <option value="ieee">IEEE Style</option>
              <option value="nature">Nature / Springer</option>
              <option value="neurips">NeurIPS (Viridis)</option>
              <option value="monochrome">Monochrome Print</option>
            </select>
          </div>

          <button
            onClick={handleExportSVG}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium border border-gray-300 dark:border-zinc-700"
            title="Export vector SVG"
          >
            <Download className="w-3 h-3 text-blue-500" />
            <span>Export SVG</span>
          </button>

          <button
            onClick={handleExportPNG}
            disabled={exporting}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs disabled:opacity-50"
            title="Export 300 DPI high-resolution PNG for LaTeX"
          >
            <ImageIcon className="w-3 h-3" />
            <span>{exporting ? 'Rendering...' : '300 DPI PNG'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Confusion Matrix Heatmap (SVG Rendered for crisp vector export) */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Confusion Matrix ({matrix.length} × {matrix.length}) — {styleConfig.name}
            </h3>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono">
            OA: {activeRun?.results.overall_accuracy.toFixed(2)}% | κ: {activeRun?.results.cohens_kappa.toFixed(4)}
          </span>
        </div>

        {matrix.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No confusion matrix recorded for this run.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              {/* Standalone SVG representation for clean paper export */}
              <svg
                ref={matrixSvgRef}
                viewBox={`0 0 ${matrix.length * 42 + 90} ${matrix.length * 42 + 100}`}
                className="w-full max-w-[850px] mx-auto select-none font-mono"
                style={{ fontFamily: styleConfig.fontFamily }}
              >
                <rect
                  x="0"
                  y="0"
                  width={matrix.length * 42 + 90}
                  height={matrix.length * 42 + 100}
                  fill={styleConfig.bgFill}
                />

                {/* Figure Title */}
                <text
                  x="45"
                  y="25"
                  className="font-bold text-[13px]"
                  fill={styleConfig.textFill}
                >
                  {activeRun?.name} ({selectedDataset}) — Confusion Matrix ({styleConfig.name})
                </text>

                {/* Column Headers (Predicted) */}
                <text
                  x={(matrix.length * 42 + 90) / 2}
                  y="48"
                  textAnchor="middle"
                  className="text-[10px] font-bold"
                  fill={styleConfig.textFill}
                >
                  Predicted Class Index
                </text>

                {classNames.slice(0, matrix.length).map((cn, idx) => (
                  <text
                    key={idx}
                    x={75 + idx * 42 + 21}
                    y="65"
                    textAnchor="middle"
                    className="text-[9px]"
                    fill={styleConfig.subtextFill}
                  >
                    C{idx + 1}
                  </text>
                ))}

                {/* Y Axis Title */}
                <text
                  x="15"
                  y={(matrix.length * 42 + 100) / 2}
                  textAnchor="middle"
                  transform={`rotate(-90, 15, ${(matrix.length * 42 + 100) / 2})`}
                  className="text-[10px] font-bold"
                  fill={styleConfig.textFill}
                >
                  Actual Class
                </text>

                {/* Cells and Row Labels */}
                {matrix.map((row, i) => (
                  <g key={i}>
                    {/* Row Label */}
                    <text
                      x="65"
                      y={75 + i * 42 + 25}
                      textAnchor="end"
                      className="text-[9px] font-semibold"
                      fill={styleConfig.subtextFill}
                    >
                      C{i + 1}
                    </text>

                    {/* Cells */}
                    {row.map((val, j) => {
                      const isDiagonal = i === j;
                      const ratio = val / maxCellVal;
                      const x = 75 + j * 42;
                      const y = 75 + i * 42;

                      let cellFill = '#f9fafb';
                      let textFill = '#9ca3af';

                      if (academicStyle === 'monochrome') {
                        // Print-ready grayscale
                        if (val > 0) {
                          const gray = Math.round(255 - Math.min(1, Math.pow(ratio, 0.4)) * 210);
                          cellFill = `rgb(${gray}, ${gray}, ${gray})`;
                          textFill = gray < 130 ? '#ffffff' : '#000000';
                        }
                      } else if (academicStyle === 'neurips') {
                        // Viridis colormap
                        if (val > 0) {
                          const t = Math.min(1, Math.pow(ratio, 0.45));
                          cellFill = isDiagonal
                            ? `rgba(33, 145, 140, ${Math.max(0.25, t)})`
                            : `rgba(68, 1, 84, ${Math.max(0.15, t)})`;
                          textFill = '#0f172a';
                        }
                      } else if (academicStyle === 'nature') {
                        // Okabe-Ito colors
                        if (val > 0) {
                          const t = Math.min(1, Math.pow(ratio, 0.4));
                          cellFill = isDiagonal
                            ? `rgba(0, 158, 115, ${Math.max(0.25, t)})`
                            : `rgba(213, 94, 0, ${Math.max(0.2, t)})`;
                          textFill = '#111827';
                        }
                      } else {
                        // Standard IEEE Classic
                        if (val > 0) {
                          const t = Math.min(1, Math.pow(ratio, 0.4));
                          cellFill = isDiagonal
                            ? `rgba(16, 185, 129, ${Math.max(0.25, t)})`
                            : `rgba(239, 68, 68, ${Math.max(0.18, t)})`;
                          textFill = isDiagonal ? '#064e3b' : '#7f1d1d';
                        }
                      }

                      return (
                        <g
                          key={j}
                          onMouseEnter={() => setHoveredCell({ actual: i, pred: j, count: val })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={x}
                            y={y}
                            width="40"
                            height="40"
                            rx="2"
                            fill={cellFill}
                            stroke={isDiagonal ? (academicStyle === 'monochrome' ? '#000' : '#10b981') : '#e5e7eb'}
                            strokeWidth={isDiagonal ? '1.5' : '0.5'}
                          />
                          <text
                            x={x + 20}
                            y={y + 24}
                            textAnchor="middle"
                            className="text-[10px] font-bold"
                            fill={textFill}
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* Hovered cell tooltip bar */}
        <div className="h-6 flex items-center text-xs font-mono">
          {hoveredCell ? (
            <div className="flex items-center space-x-3 text-gray-800 dark:text-zinc-200">
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
            <span className="text-gray-500 dark:text-zinc-400 text-[11px]">Hover over matrix cells to inspect class-pair details.</span>
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
            <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">
              Recall, Precision, and F1 per spectral target
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-800 text-[10px] text-gray-500 dark:text-zinc-400 uppercase">
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
                    <tr key={c.class_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 text-gray-500 dark:text-zinc-400">{c.class_id}</td>
                      <td className="p-3 font-sans font-medium text-gray-900 dark:text-zinc-100">
                        {c.class_name}
                      </td>
                      <td className="p-3 text-right text-gray-800 dark:text-zinc-200">{c.samples}</td>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{c.correct}</td>
                      <td className="p-3 text-right">
                        <span className={isLow ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                          {c.accuracy.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-800 dark:text-zinc-200">{c.precision.toFixed(2)}%</td>
                      <td className="p-3 text-right font-semibold text-gray-900 dark:text-zinc-100">{c.f1.toFixed(2)}%</td>
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
