import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { calculateParetoFrontier } from '../utils/metrics';
import {
  GitCompare,
  TrendingUp,
  Download,
  Image as ImageIcon,
  Palette,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { ACADEMIC_STYLES, AcademicStyle, exportSvgAsFile, exportSvgAsPng } from '../utils/exportFigure';

export default function CompareView() {
  const { runs, selectedRunIds, toggleSelectRun, setActiveTab, setSelectedRunIds, toast } = useApp();

  const [objective, setObjective] = useState<'overall_accuracy' | 'cohens_kappa' | 'macro_f1'>('overall_accuracy');
  const [efficiencyMetric, setEfficiencyMetric] = useState<'params_m' | 'flops_gflops' | 'inference_latency_ms'>('params_m');
  const [academicStyle, setAcademicStyle] = useState<AcademicStyle>('ieee');
  const [exporting, setExporting] = useState(false);

  const paretoSvgRef = useRef<SVGSVGElement | null>(null);
  const styleConfig = ACADEMIC_STYLES[academicStyle];

  const comparedRuns = runs.filter((r) => selectedRunIds.includes(r.id));

  // Compute Pareto Frontier
  const { paretoRuns, dominatedRuns } = calculateParetoFrontier(
    comparedRuns.length > 0 ? comparedRuns : runs,
    objective,
    efficiencyMetric,
    true, // Higher accuracy is better
    false // Lower params/flops/latency is better
  );

  const bestOA = comparedRuns.length > 0 ? Math.max(...comparedRuns.map((r) => r.results.overall_accuracy)) : 0;
  const bestKappa = comparedRuns.length > 0 ? Math.max(...comparedRuns.map((r) => r.results.cohens_kappa)) : 0;
  const minParams = comparedRuns.filter((r) => r.results.params_m != null).length > 0
    ? Math.min(...comparedRuns.filter((r) => r.results.params_m != null).map((r) => r.results.params_m!))
    : 0;

  const handleExportSVG = () => {
    if (!paretoSvgRef.current) return;
    const filename = `pareto_tradeoff_${objective}_${efficiencyMetric}_${academicStyle}`;
    exportSvgAsFile(paretoSvgRef.current, filename);
    toast(`Exported Pareto figure as ${filename}.svg`, 'success');
  };

  const handleExportPNG = async () => {
    if (!paretoSvgRef.current) return;
    try {
      setExporting(true);
      const filename = `pareto_tradeoff_${objective}_${efficiencyMetric}_${academicStyle}`;
      await exportSvgAsPng(paretoSvgRef.current, filename, 3.0);
      toast(`Exported 300 DPI publication figure (${filename}_300dpi.png)`, 'success');
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
            <GitCompare className="w-5 h-5 text-indigo-500" />
            <span>Model Comparison & Pareto Analysis</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Side-by-side scientific evaluation, multi-objective ranking, and computational trade-offs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('chat')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Comparison with Gemini</span>
          </button>
        </div>
      </div>

      {/* Run Selection Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
            Select Runs to Compare ({selectedRunIds.length} active):
          </span>
          <button
            onClick={() => setSelectedRunIds(runs.slice(0, 4).map((r) => r.id))}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Select Top 4 Benchmarks
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {runs.map((r) => {
            const isSelected = selectedRunIds.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleSelectRun(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-gray-50 dark:bg-zinc-800/80 text-gray-800 dark:text-zinc-200 border-gray-300 dark:border-zinc-700 hover:border-blue-500'
                }`}
              >
                <span>{r.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({r.results.overall_accuracy}%)</span>
              </button>
            );
          })}
        </div>
      </div>

      {comparedRuns.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-zinc-900 border border-dashed border-gray-300 dark:border-zinc-700 space-y-2">
          <GitCompare className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">No Runs Selected</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Click on at least two runs above or in the Experiments table to generate side-by-side matrices.
          </p>
        </div>
      ) : (
        <>
          {/* Side by Side Metric Comparison Table */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span>Side-by-Side Architectural Evaluation</span>
              </h2>
              <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">
                {comparedRuns.length} models evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/70 border-b border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 font-mono text-[10px] uppercase">
                    <th className="p-3">Attribute / Metric</th>
                    {comparedRuns.map((r) => (
                      <th key={r.id} className="p-3 text-right min-w-[140px]">
                        <div className="font-bold text-gray-900 dark:text-zinc-100">{r.name}</div>
                        <div className="text-[10px] text-gray-500">{r.id}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-mono">
                  {/* Architecture */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Architecture Family</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 text-[11px]">
                          {r.hyperparameters.model_family}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Dataset & Split */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Dataset & Split</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-[11px] text-gray-600 dark:text-zinc-400">
                        {r.metadata.dataset} (10% train)
                      </td>
                    ))}
                  </tr>

                  {/* Overall Accuracy (OA) */}
                  <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                    <td className="p-3 font-sans font-semibold text-gray-900 dark:text-zinc-100">
                      Overall Accuracy (OA)
                    </td>
                    {comparedRuns.map((r) => {
                      const isBest = r.results.overall_accuracy === bestOA;
                      return (
                        <td key={r.id} className="p-3 text-right font-bold text-sm">
                          <span className={isBest ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-gray-900 dark:text-zinc-200'}>
                            {r.results.overall_accuracy.toFixed(2)}%
                            {isBest && ' ★'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Average Accuracy (AA) */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Average Accuracy (AA)</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-gray-800 dark:text-zinc-200">
                        {r.results.average_accuracy.toFixed(2)}%
                      </td>
                    ))}
                  </tr>

                  {/* Cohen's Kappa */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Cohen's Kappa (κ)</td>
                    {comparedRuns.map((r) => {
                      const isBest = r.results.cohens_kappa === bestKappa;
                      return (
                        <td key={r.id} className="p-3 text-right">
                          <span className={isBest ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-800 dark:text-zinc-200'}>
                            {r.results.cohens_kappa.toFixed(4)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Macro F1 */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Macro F1 Score</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-gray-800 dark:text-zinc-200">
                        {r.results.macro_f1.toFixed(2)}%
                      </td>
                    ))}
                  </tr>

                  {/* Parameters */}
                  <tr className="bg-purple-50/40 dark:bg-purple-950/20">
                    <td className="p-3 font-sans font-semibold text-gray-900 dark:text-zinc-100">
                      Parameters (M)
                    </td>
                    {comparedRuns.map((r) => {
                      const isMin = r.results.params_m === minParams;
                      return (
                        <td key={r.id} className="p-3 text-right">
                          {r.results.params_m != null ? (
                            <span className={isMin ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-800 dark:text-zinc-200'}>
                              {r.results.params_m}M {isMin && '(Most Efficient)'}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* FLOPs */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Computation (GFLOPs)</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-gray-800 dark:text-zinc-200">
                        {r.results.flops_gflops != null ? `${r.results.flops_gflops} G` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Latency */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Inference Latency</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-gray-800 dark:text-zinc-200">
                        {r.results.inference_latency_ms != null ? `${r.results.inference_latency_ms} ms` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Training Duration */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-800 dark:text-zinc-200">Training Duration</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-gray-600 dark:text-zinc-400">
                        {r.results.training_duration_s ? `${r.results.training_duration_s.toFixed(1)}s` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Pareto Status */}
                  <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                    <td className="p-3 font-sans font-bold text-gray-900 dark:text-zinc-100">
                      Pareto Frontier Status
                    </td>
                    {comparedRuns.map((r) => {
                      const isPareto = paretoRuns.some((p) => p.id === r.id);
                      return (
                        <td key={r.id} className="p-3 text-right">
                          {isPareto ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                              <span>Pareto Optimal</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 dark:text-zinc-500">Dominated</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pareto Frontier Scatter / Trade-Off Analysis */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Pareto Efficiency Trade-Off Curve</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Export vector SVG or 300 DPI PNG figures formatted for academic journals.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  <select
                    value={academicStyle}
                    onChange={(e) => setAcademicStyle(e.target.value as AcademicStyle)}
                    className="bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-800 dark:text-zinc-200 font-medium"
                  >
                    <option value="ieee">IEEE Style</option>
                    <option value="nature">Nature / Springer</option>
                    <option value="neurips">NeurIPS Style</option>
                    <option value="monochrome">Monochrome Print</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-gray-500">X-Axis:</span>
                  <select
                    value={efficiencyMetric}
                    onChange={(e) => setEfficiencyMetric(e.target.value as any)}
                    className="bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="params_m">Parameters (M)</option>
                    <option value="flops_gflops">GFLOPs</option>
                    <option value="inference_latency_ms">Latency (ms)</option>
                  </select>
                </div>

                <button
                  onClick={handleExportSVG}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-medium border border-gray-300 dark:border-zinc-700"
                >
                  <Download className="w-3 h-3 text-blue-500" />
                  <span>Export SVG</span>
                </button>

                <button
                  onClick={handleExportPNG}
                  disabled={exporting}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs disabled:opacity-50"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{exporting ? 'Rendering...' : '300 DPI PNG'}</span>
                </button>
              </div>
            </div>

            {/* Standalone SVG Pareto Canvas for Paper Export */}
            <div className="border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-4">
              <svg
                ref={paretoSvgRef}
                viewBox="0 0 900 360"
                className="w-full h-72 select-none"
                style={{ fontFamily: styleConfig.fontFamily }}
              >
                <rect x="0" y="0" width="900" height="360" fill={styleConfig.bgFill} />

                {/* Figure Title */}
                <text x="60" y="25" className="font-bold text-[13px]" fill={styleConfig.textFill}>
                  Pareto Frontier: Accuracy vs Computational Complexity ({styleConfig.name})
                </text>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                  const y = 50 + frac * 240;
                  const accLabel = (100 - frac * 15).toFixed(1) + '%';
                  return (
                    <g key={idx}>
                      <line
                        x1="70"
                        y1={y}
                        x2="850"
                        y2={y}
                        stroke={styleConfig.gridStroke}
                        strokeDasharray="4 4"
                      />
                      <text x="62" y={y + 4} textAnchor="end" className="text-[10px]" fill={styleConfig.subtextFill}>
                        {accLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Spines */}
                <line x1="70" y1="50" x2="70" y2="290" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                <line x1="70" y1="290" x2="850" y2="290" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                {(academicStyle === 'ieee' || academicStyle === 'monochrome') && (
                  <>
                    <line x1="850" y1="50" x2="850" y2="290" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                    <line x1="70" y1="50" x2="850" y2="50" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                  </>
                )}

                {/* X-Axis and Y-Axis Labels */}
                <text x="460" y="325" textAnchor="middle" className="text-[11px] font-bold" fill={styleConfig.textFill}>
                  {efficiencyMetric.replace('_', ' ').toUpperCase()} (Lower is Better)
                </text>
                <text
                  x="20"
                  y="170"
                  textAnchor="middle"
                  transform="rotate(-90, 20, 170)"
                  className="text-[11px] font-bold"
                  fill={styleConfig.textFill}
                >
                  Overall Accuracy (OA %)
                </text>

                {/* Points on Canvas */}
                {comparedRuns.map((r) => {
                  const xVal = r.results[efficiencyMetric] ?? 1;
                  const yVal = r.results[objective];
                  const isPareto = paretoRuns.some((p) => p.id === r.id);

                  // Normalized coordinates (70 to 850 in X, 50 to 290 in Y)
                  const x = 70 + Math.min(760, Math.max(20, (xVal / 14) * 720));
                  const y = 50 + Math.min(230, Math.max(10, ((100 - yVal) / 15) * 230));

                  return (
                    <g key={r.id} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isPareto ? 7 : 5}
                        fill={isPareto ? styleConfig.paretoColor : (academicStyle === 'monochrome' ? '#9ca3af' : '#6b7280')}
                        stroke={isPareto ? (academicStyle === 'monochrome' ? '#000000' : '#ffffff') : '#ffffff'}
                        strokeWidth="2"
                      />
                      <text
                        x={x + 10}
                        y={y + 4}
                        className="text-[10px] font-mono font-bold"
                        fill={isPareto ? styleConfig.textFill : styleConfig.subtextFill}
                      >
                        {r.name} ({yVal}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
