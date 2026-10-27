import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateParetoFrontier } from '../utils/metrics';
import {
  GitCompare,
  TrendingUp,
  Cpu,
  Clock,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function CompareView() {
  const { runs, selectedRunIds, toggleSelectRun, setActiveTab, setSelectedRunIds } = useApp();

  const [objective, setObjective] = useState<'overall_accuracy' | 'cohens_kappa' | 'macro_f1'>('overall_accuracy');
  const [efficiencyMetric, setEfficiencyMetric] = useState<'params_m' | 'flops_gflops' | 'inference_latency_ms'>('params_m');

  const comparedRuns = runs.filter((r) => selectedRunIds.includes(r.id));

  // Compute Pareto Frontier
  const { paretoRuns, dominatedRuns } = calculateParetoFrontier(
    comparedRuns.length > 0 ? comparedRuns : runs,
    objective,
    efficiencyMetric,
    true, // Higher accuracy is better
    false // Lower params/flops/latency is better
  );

  // Best observed values among compared for highlighting
  const bestOA = comparedRuns.length > 0 ? Math.max(...comparedRuns.map((r) => r.results.overall_accuracy)) : 0;
  const bestKappa = comparedRuns.length > 0 ? Math.max(...comparedRuns.map((r) => r.results.cohens_kappa)) : 0;
  const minParams = comparedRuns.filter((r) => r.results.params_m != null).length > 0
    ? Math.min(...comparedRuns.filter((r) => r.results.params_m != null).map((r) => r.results.params_m!))
    : 0;

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
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
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
                    : 'bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-blue-400'
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">No Runs Selected</h3>
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
              <span className="text-xs text-gray-400 font-mono">
                {comparedRuns.length} models evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/70 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 font-mono text-[10px] uppercase">
                    <th className="p-3">Attribute / Metric</th>
                    {comparedRuns.map((r) => (
                      <th key={r.id} className="p-3 text-right min-w-[140px]">
                        <div className="font-bold text-gray-900 dark:text-zinc-100">{r.name}</div>
                        <div className="text-[10px] text-gray-400">{r.id}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-mono">
                  {/* Architecture */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Architecture Family</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-[11px]">
                          {r.hyperparameters.model_family}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Dataset & Split */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Dataset & Split</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-[11px] text-gray-600 dark:text-zinc-400">
                        {r.metadata.dataset} (10% train)
                      </td>
                    ))}
                  </tr>

                  {/* Overall Accuracy (OA) */}
                  <tr className="bg-emerald-50/20 dark:bg-emerald-950/10">
                    <td className="p-3 font-sans font-semibold text-gray-900 dark:text-zinc-100">
                      Overall Accuracy (OA)
                    </td>
                    {comparedRuns.map((r) => {
                      const isBest = r.results.overall_accuracy === bestOA;
                      return (
                        <td key={r.id} className="p-3 text-right font-bold text-sm">
                          <span className={isBest ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-gray-800 dark:text-zinc-200'}>
                            {r.results.overall_accuracy.toFixed(2)}%
                            {isBest && ' ★'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Average Accuracy (AA) */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Average Accuracy (AA)</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right">
                        {r.results.average_accuracy.toFixed(2)}%
                      </td>
                    ))}
                  </tr>

                  {/* Cohen's Kappa */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Cohen's Kappa (κ)</td>
                    {comparedRuns.map((r) => {
                      const isBest = r.results.cohens_kappa === bestKappa;
                      return (
                        <td key={r.id} className="p-3 text-right">
                          <span className={isBest ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                            {r.results.cohens_kappa.toFixed(4)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Macro F1 */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Macro F1 Score</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right">
                        {r.results.macro_f1.toFixed(2)}%
                      </td>
                    ))}
                  </tr>

                  {/* Parameters */}
                  <tr className="bg-purple-50/20 dark:bg-purple-950/10">
                    <td className="p-3 font-sans font-semibold text-gray-900 dark:text-zinc-100">
                      Parameters (M)
                    </td>
                    {comparedRuns.map((r) => {
                      const isMin = r.results.params_m === minParams;
                      return (
                        <td key={r.id} className="p-3 text-right">
                          {r.results.params_m != null ? (
                            <span className={isMin ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}>
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
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Computation (GFLOPs)</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right">
                        {r.results.flops_gflops != null ? `${r.results.flops_gflops} G` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Latency */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Inference Latency</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right">
                        {r.results.inference_latency_ms != null ? `${r.results.inference_latency_ms} ms` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Training Duration */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-gray-700 dark:text-zinc-300">Training Duration</td>
                    {comparedRuns.map((r) => (
                      <td key={r.id} className="p-3 text-right text-gray-500">
                        {r.results.training_duration_s ? `${r.results.training_duration_s.toFixed(1)}s` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Pareto Status */}
                  <tr className="bg-blue-50/30 dark:bg-blue-950/20">
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
                            <span className="text-[10px] text-gray-400">Dominated</span>
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
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Pareto Efficiency Trade-Off Curve</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Models on the outer frontier maximize accuracy for a given computational constraint.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-400">Efficiency Axis:</span>
                <select
                  value={efficiencyMetric}
                  onChange={(e) => setEfficiencyMetric(e.target.value as any)}
                  className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2.5 py-1 text-gray-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="params_m">Parameters (M) - Lower is Better</option>
                  <option value="flops_gflops">Computation (GFLOPs) - Lower is Better</option>
                  <option value="inference_latency_ms">Latency (ms) - Lower is Better</option>
                </select>
              </div>
            </div>

            {/* Interactive SVG Pareto Curve */}
            <div className="h-64 border border-gray-100 dark:border-zinc-800 rounded-lg p-4 bg-gray-50/50 dark:bg-zinc-950/50 relative flex flex-col justify-between">
              {/* Plot canvas */}
              <div className="relative w-full h-full">
                {comparedRuns.map((r) => {
                  const xVal = r.results[efficiencyMetric] ?? 1;
                  const yVal = r.results[objective];
                  const isPareto = paretoRuns.some((p) => p.id === r.id);

                  // Normalized coordinates (0 to 100%)
                  // x range: 0.1 to 15 (params or flops)
                  const xPct = Math.min(90, Math.max(10, (xVal / 14) * 80 + 10));
                  // y range: 85 to 100 (%)
                  const yPct = Math.min(90, Math.max(10, ((100 - yVal) / 15) * 80 + 10));

                  return (
                    <div
                      key={r.id}
                      style={{ left: `${xPct}%`, top: `${yPct}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-150 flex items-center justify-center ${
                          isPareto
                            ? 'bg-emerald-500 border-white dark:border-zinc-900 shadow-md shadow-emerald-500/50'
                            : 'bg-gray-400 border-white dark:border-zinc-900'
                        }`}
                      />

                      {/* Tooltip */}
                      <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden group-hover:block z-20 bg-gray-900 text-white text-[11px] p-2 rounded-md shadow-lg pointer-events-none whitespace-nowrap font-mono">
                        <div className="font-bold">{r.name}</div>
                        <div>{objective.toUpperCase()}: {yVal}%</div>
                        <div>{efficiencyMetric}: {xVal}</div>
                        <div className={isPareto ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                          {isPareto ? '✓ Pareto Optimal' : 'Dominated'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Axes labels */}
                <div className="absolute left-2 top-2 text-[10px] font-mono text-gray-400">
                  ▲ High Accuracy (OA)
                </div>
                <div className="absolute right-2 bottom-2 text-[10px] font-mono text-gray-400">
                  Heavy Compute ►
                </div>
                <div className="absolute left-2 bottom-2 text-[10px] font-mono text-emerald-500 font-semibold">
                  ★ Ideal Frontier (High Accuracy, Low Compute)
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
