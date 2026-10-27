import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  Sparkles,
  Download,
  Image as ImageIcon,
  Palette,
  CheckCircle2,
} from 'lucide-react';
import { ACADEMIC_STYLES, AcademicStyle, exportSvgAsFile, exportSvgAsPng } from '../utils/exportFigure';

export default function TrainingAnalyticsView() {
  const { runs, inspectRunId, setInspectRunId, toast } = useApp();

  const selectedRun = runs.find((r) => r.id === inspectRunId) || runs[0];
  const [metricTab, setMetricTab] = useState<'loss' | 'accuracy' | 'lr' | 'compute'>('loss');
  const [hoveredEpoch, setHoveredEpoch] = useState<number | null>(null);
  const [academicStyle, setAcademicStyle] = useState<AcademicStyle>('ieee');
  const [exporting, setExporting] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!selectedRun) {
    return (
      <div className="p-12 text-center text-gray-500">
        No training run data available.
      </div>
    );
  }

  const epochs = selectedRun.epochs || [];
  const diagnostics = selectedRun.diagnostics || [];
  const styleConfig = ACADEMIC_STYLES[academicStyle];

  const maxLoss = epochs.length > 0 ? Math.max(...epochs.map((e) => Math.max(e.train_loss, e.val_loss))) : 1;
  const maxOA = 100;
  const minOA = epochs.length > 0 ? Math.min(...epochs.map((e) => Math.min(e.train_oa, e.val_oa))) : 0;
  const maxLR = epochs.length > 0 ? Math.max(...epochs.map((e) => e.learning_rate)) : 0.001;

  const hoveredData = hoveredEpoch !== null ? epochs.find((e) => e.epoch === hoveredEpoch) : null;

  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const filename = `${selectedRun.name.replace(/\s+/g, '_')}_${metricTab}_${academicStyle}`;
    exportSvgAsFile(svgRef.current, filename);
    toast(`Exported figure as ${filename}.svg`, 'success');
  };

  const handleExportPNG = async () => {
    if (!svgRef.current) return;
    try {
      setExporting(true);
      const filename = `${selectedRun.name.replace(/\s+/g, '_')}_${metricTab}_${academicStyle}`;
      await exportSvgAsPng(svgRef.current, filename, 3.0);
      toast(`Exported 300 DPI publication figure (${filename}_300dpi.png)`, 'success');
    } catch (err: any) {
      toast('Failed to render PNG export', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Run Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span>Training Curve Analyzer & Diagnostics</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Deterministic detection of overfitting, instability, plateauing, and publication figure export.
          </p>
        </div>

        {/* Run Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="inspect-run-select" className="text-xs text-gray-500 dark:text-zinc-400">
            Active Run:
          </label>
          <select
            id="inspect-run-select"
            value={selectedRun.id}
            onChange={(e) => setInspectRunId(e.target.value)}
            className="text-xs font-semibold bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}: {r.name} ({r.results.overall_accuracy}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left Curve Visualizer, Right Diagnostics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Scientific Curve */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          {/* Chart Header & Metric Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-gray-900 dark:text-zinc-100">
                  {selectedRun.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {selectedRun.hyperparameters.architecture}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 font-mono">
                Epochs: {epochs.length} • Batch: {selectedRun.hyperparameters.batch_size} • LR: {selectedRun.hyperparameters.learning_rate}
              </p>
            </div>

            {/* Metric Tabs */}
            <div className="flex items-center space-x-1 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-medium">
              <button
                onClick={() => setMetricTab('loss')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metricTab === 'loss' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-600 dark:text-zinc-400'
                }`}
              >
                Loss Curves
              </button>
              <button
                onClick={() => setMetricTab('accuracy')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metricTab === 'accuracy' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-600 dark:text-zinc-400'
                }`}
              >
                Accuracy (OA)
              </button>
              <button
                onClick={() => setMetricTab('lr')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metricTab === 'lr' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-600 dark:text-zinc-400'
                }`}
              >
                LR Schedule
              </button>
              <button
                onClick={() => setMetricTab('compute')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  metricTab === 'compute' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-600 dark:text-zinc-400'
                }`}
              >
                VRAM & Time
              </button>
            </div>
          </div>

          {/* Academic Style & Export Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 text-xs">
            <div className="flex items-center space-x-2">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold text-gray-700 dark:text-zinc-300">Publication Style:</span>
              <select
                value={academicStyle}
                onChange={(e) => setAcademicStyle(e.target.value as AcademicStyle)}
                className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md px-2.5 py-1 text-gray-900 dark:text-zinc-100 font-medium cursor-pointer"
              >
                <option value="ieee">IEEE Transactions (Classic Serif / High Contrast)</option>
                <option value="nature">Nature / Springer (Okabe-Ito Colorblind-Safe)</option>
                <option value="neurips">NeurIPS / ACM (Modern Crisp Vector)</option>
                <option value="monochrome">Monochrome (Physical Print B&W)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportSVG}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium transition-colors"
                title="Export standalone scalable vector graphics file"
              >
                <Download className="w-3 h-3 text-blue-500" />
                <span>Export SVG</span>
              </button>

              <button
                onClick={handleExportPNG}
                disabled={exporting}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs transition-colors disabled:opacity-50"
                title="Export publication 300 DPI high-resolution PNG for LaTeX/Word"
              >
                <ImageIcon className="w-3 h-3" />
                <span>{exporting ? 'Rendering...' : 'Export 300 DPI PNG'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Curve Canvas */}
          <div className="relative h-72 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-4 select-none">
            {epochs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                No epoch history recorded for this run.
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox="0 0 1000 280"
                className="w-full h-full overflow-visible"
                style={{ fontFamily: styleConfig.fontFamily }}
              >
                {/* Background for clean standalone export */}
                <rect x="0" y="0" width="1000" height="280" fill={styleConfig.bgFill} />

                {/* Academic Title Header inside SVG */}
                <text
                  x="50"
                  y="20"
                  className="font-bold text-[11px]"
                  fill={styleConfig.textFill}
                >
                  {selectedRun.name} — {metricTab.toUpperCase()} ({styleConfig.name})
                </text>

                {/* Horizontal grid lines & labels */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                  const y = 40 + frac * 200;
                  let label = '';
                  if (metricTab === 'loss') {
                    label = (maxLoss * (1 - frac)).toFixed(2);
                  } else if (metricTab === 'accuracy') {
                    label = `${(maxOA - frac * (maxOA - minOA)).toFixed(1)}%`;
                  } else if (metricTab === 'lr') {
                    label = (maxLR * (1 - frac)).toExponential(1);
                  } else {
                    label = `${Math.round(4500 - frac * 2000)}MB`;
                  }

                  return (
                    <g key={idx}>
                      <line
                        x1="55"
                        y1={y}
                        x2="970"
                        y2={y}
                        stroke={styleConfig.gridStroke}
                        strokeWidth="1"
                        strokeDasharray={academicStyle === 'monochrome' ? '3 3' : '4 4'}
                      />
                      <text
                        x="48"
                        y={y + 3}
                        textAnchor="end"
                        className="text-[9px]"
                        fill={styleConfig.subtextFill}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Spines (IEEE / Monochome has clear bounding border) */}
                <line x1="55" y1="40" x2="55" y2="240" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                <line x1="55" y1="240" x2="970" y2="240" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                {(academicStyle === 'ieee' || academicStyle === 'monochrome') && (
                  <>
                    <line x1="970" y1="40" x2="970" y2="240" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                    <line x1="55" y1="40" x2="970" y2="40" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                  </>
                )}

                {/* Primary curves based on metricTab and academic style */}
                {metricTab === 'loss' && (
                  <>
                    {/* Train loss line */}
                    <polyline
                      fill="none"
                      stroke={styleConfig.trainLine.stroke}
                      strokeWidth={styleConfig.trainLine.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={styleConfig.trainLine.dasharray}
                      points={epochs
                        .map((e, idx) => {
                          const x = 55 + (idx / (epochs.length - 1)) * 915;
                          const y = 240 - (e.train_loss / maxLoss) * 200;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />

                    {/* Val loss line */}
                    <polyline
                      fill="none"
                      stroke={styleConfig.valLine.stroke}
                      strokeWidth={styleConfig.valLine.strokeWidth}
                      strokeDasharray={styleConfig.valLine.dasharray || '6 4'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={epochs
                        .map((e, idx) => {
                          const x = 55 + (idx / (epochs.length - 1)) * 915;
                          const y = 240 - (e.val_loss / maxLoss) * 200;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />
                  </>
                )}

                {metricTab === 'accuracy' && (
                  <>
                    {/* Train OA line */}
                    <polyline
                      fill="none"
                      stroke={styleConfig.trainLine.stroke}
                      strokeWidth={styleConfig.trainLine.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={styleConfig.trainLine.dasharray}
                      points={epochs
                        .map((e, idx) => {
                          const x = 55 + (idx / (epochs.length - 1)) * 915;
                          const norm = (e.train_oa - minOA) / (maxOA - minOA || 1);
                          const y = 240 - norm * 200;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />

                    {/* Val OA line */}
                    <polyline
                      fill="none"
                      stroke={styleConfig.valLine.stroke}
                      strokeWidth={styleConfig.valLine.strokeWidth}
                      strokeDasharray={styleConfig.valLine.dasharray || '6 4'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={epochs
                        .map((e, idx) => {
                          const x = 55 + (idx / (epochs.length - 1)) * 915;
                          const norm = (e.val_oa - minOA) / (maxOA - minOA || 1);
                          const y = 240 - norm * 200;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />
                  </>
                )}

                {metricTab === 'lr' && (
                  <polyline
                    fill="none"
                    stroke={styleConfig.accentColor}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    points={epochs
                      .map((e, idx) => {
                        const x = 55 + (idx / (epochs.length - 1)) * 915;
                        const norm = e.learning_rate / (maxLR || 1);
                        const y = 240 - norm * 200;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                )}

                {metricTab === 'compute' && (
                  <polyline
                    fill="none"
                    stroke={styleConfig.trainLine.stroke}
                    strokeWidth="2.8"
                    points={epochs
                      .map((e, idx) => {
                        const x = 55 + (idx / (epochs.length - 1)) * 915;
                        const norm = ((e.gpu_mem_mb ?? 3000) - 2000) / 2500;
                        const y = 240 - norm * 200;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                )}

                {/* X-Axis Epoch Label in SVG */}
                <text x="510" y="265" textAnchor="middle" className="text-[10px]" fill={styleConfig.subtextFill}>
                  Epoch Number (1 to {epochs.length})
                </text>

                {/* Hover trigger columns */}
                {epochs.map((e, idx) => {
                  const x = 55 + (idx / (epochs.length - 1)) * 915;
                  return (
                    <rect
                      key={e.epoch}
                      x={Math.max(0, x - 12)}
                      y="30"
                      width="24"
                      height="210"
                      fill="transparent"
                      className="cursor-pointer hover:fill-blue-500/10"
                      onMouseEnter={() => setHoveredEpoch(e.epoch)}
                    />
                  );
                })}
              </svg>
            )}

            {/* Hover inspection overlay */}
            {hoveredData && (
              <div className="absolute right-4 top-4 p-3 rounded-lg bg-gray-900/95 text-white text-[11px] font-mono shadow-xl border border-gray-700 pointer-events-none space-y-1">
                <div className="font-bold text-blue-400">Epoch {hoveredData.epoch} / {epochs.length}</div>
                <div>Train Loss: {hoveredData.train_loss.toFixed(4)}</div>
                <div>Val Loss: {hoveredData.val_loss.toFixed(4)}</div>
                <div>Train OA: {hoveredData.train_oa.toFixed(2)}%</div>
                <div>Val OA: {hoveredData.val_oa.toFixed(2)}%</div>
                <div>LR: {hoveredData.learning_rate.toExponential(2)}</div>
                {hoveredData.gpu_mem_mb && <div>VRAM: {hoveredData.gpu_mem_mb} MB</div>}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 dark:text-zinc-400 font-mono pt-2">
            <div className="flex items-center space-x-4">
              {metricTab === 'loss' && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3.5 h-1 rounded" style={{ backgroundColor: styleConfig.trainLine.stroke }} />
                    <span className="font-medium">Train Loss</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3.5 h-1 rounded border-b-2" style={{ borderColor: styleConfig.valLine.stroke }} />
                    <span className="font-medium">Val Loss ({styleConfig.name})</span>
                  </div>
                </>
              )}

              {metricTab === 'accuracy' && (
                <>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3.5 h-1 rounded" style={{ backgroundColor: styleConfig.trainLine.stroke }} />
                    <span className="font-medium">Train Accuracy</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3.5 h-1 rounded border-b-2" style={{ borderColor: styleConfig.valLine.stroke }} />
                    <span className="font-medium">Val Accuracy</span>
                  </div>
                </>
              )}

              {metricTab === 'lr' && (
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-1 rounded" style={{ backgroundColor: styleConfig.accentColor }} />
                  <span className="font-medium">Cosine Annealing LR</span>
                </div>
              )}

              {metricTab === 'compute' && (
                <div className="flex items-center space-x-1.5">
                  <span className="w-3.5 h-1 rounded" style={{ backgroundColor: styleConfig.trainLine.stroke }} />
                  <span className="font-medium">GPU Memory (MB)</span>
                </div>
              )}
            </div>

            <span className="text-[11px] text-gray-500 dark:text-zinc-400">
              {styleConfig.journal}
            </span>
          </div>
        </div>

        {/* Right 1 Col: Deterministic Diagnostics Panel */}
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Deterministic Diagnostics</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold">
              {diagnostics.length} checks
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {diagnostics.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs">
                All deterministic convergence and stability checks passed cleanly.
              </div>
            ) : (
              diagnostics.map((diag, idx) => {
                const isHigh = diag.severity === 'high';
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                      isHigh
                        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60'
                        : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-gray-900 dark:text-zinc-100">
                        {diag.title}
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          isHigh
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-300'
                        }`}
                      >
                        {diag.severity}
                      </span>
                    </div>

                    {diag.epoch_range && (
                      <div className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">
                        Observed Epoch Range: [{diag.epoch_range[0]} – {diag.epoch_range[1]}]
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">
                          Observed Evidence:
                        </span>
                        <p className="text-gray-800 dark:text-zinc-200 leading-snug">
                          {diag.observed_evidence}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">
                          Derived Calculation:
                        </span>
                        <p className="font-mono text-[11px] text-gray-700 dark:text-zinc-300">
                          {diag.derived_calculation}
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                          Actionable Recommendation:
                        </span>
                        <p className="text-[11px] leading-snug">
                          {diag.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
