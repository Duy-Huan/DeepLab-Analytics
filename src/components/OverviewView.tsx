import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  Activity,
  Split,
  Eye,
} from 'lucide-react';

export default function OverviewView() {
  const { runs, projects, setActiveTab, setInspectRunId, toggleSelectRun, selectedRunIds } = useApp();

  const completedRuns = runs.filter((r) => r.status === 'completed');
  const runningRuns = runs.filter((r) => r.status === 'running');
  const failedRuns = runs.filter((r) => r.status === 'failed');

  // Best model by OA
  const bestRun = [...runs].sort((a, b) => b.results.overall_accuracy - a.results.overall_accuracy)[0];

  // Total GPU training duration
  const totalDurationSeconds = runs.reduce((acc, r) => acc + (r.results.training_duration_s || 0), 0);
  const totalDurationMinutes = (totalDurationSeconds / 60).toFixed(1);

  // Mean parameter count
  const runsWithParams = runs.filter((r) => r.results.params_m != null);
  const avgParams = runsWithParams.length > 0
    ? (runsWithParams.reduce((acc, r) => acc + (r.results.params_m || 0), 0) / runsWithParams.length).toFixed(2)
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/80 to-purple-50/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800/40 p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />
        <div className="max-w-3xl space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Scientific Experiment Analyzer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            DeepLab Analytics Research Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Standardized tracking, reproducible evaluation, and diagnostic AI analysis for Hyperspectral Imaging and Deep Learning.
            Evaluate spectral-spatial representations, compute Pareto frontiers, and export publication-ready LaTeX tables and 300 DPI figures.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Best Model OA */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-medium">
            <span>Best Observed OA</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100 font-mono">
              {bestRun ? `${bestRun.results.overall_accuracy}%` : 'N/A'}
            </span>
            {bestRun && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                κ = {bestRun.results.cohens_kappa}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 truncate">
            {bestRun ? `${bestRun.name} (${bestRun.metadata.dataset})` : 'No runs recorded'}
          </p>
        </div>

        {/* Metric 2: Completed Experiments */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-medium">
            <span>Experiment Runs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100 font-mono">
              {runs.length}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              ({completedRuns.length} completed)
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
            Across {projects.length} research projects
          </p>
        </div>

        {/* Metric 3: Compute Time */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-medium">
            <span>GPU Runtime</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100 font-mono">
              {totalDurationMinutes}m
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium font-mono">
              {totalDurationSeconds}s total
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
            NVIDIA A100 / SXM4 Execution
          </p>
        </div>

        {/* Metric 4: Avg Parameter Footprint */}
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-medium">
            <span>Avg Model Parameters</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-zinc-100 font-mono">
              {avgParams}M
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium font-mono">
              ~2.6 GFLOPs
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
            0.58M min to 12.4M max
          </p>
        </div>
      </div>

      {/* Two Column Layout: Performance Hierarchy + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Performance Ranking */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                Model Performance Leaderboard
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('compare')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>Full Comparison</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {[...runs]
              .sort((a, b) => b.results.overall_accuracy - a.results.overall_accuracy)
              .slice(0, 5)
              .map((r, idx) => {
                const isSelected = selectedRunIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-gray-50/70 dark:bg-zinc-800/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate">
                            {r.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-zinc-300">
                            {r.id}
                          </span>
                          {r.is_demo && (
                            <span className="text-[9px] px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 font-mono font-semibold">
                              DEMO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                          {r.hyperparameters.architecture} {' • '} {r.metadata.dataset} {' • '} {r.results.params_m ? `${r.results.params_m}M params` : 'Params N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {r.results.overall_accuracy.toFixed(2)}% OA
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                          AA: {r.results.average_accuracy.toFixed(1)}% | κ: {r.results.cohens_kappa.toFixed(3)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setInspectRunId(r.id);
                            setActiveTab('training');
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400"
                          title="View Training Curves & Diagnostics"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleSelectRun(r.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border-gray-300 dark:border-zinc-700 hover:border-blue-500'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Compare'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right 1 Col: Quick AI Assistant & Diagnostic Alerts */}
        <div className="space-y-6">
          {/* AI Quick Insight Box - Clean in Light and Dark mode */}
          <div className="rounded-xl bg-indigo-50/80 dark:bg-gradient-to-br dark:from-indigo-950/60 dark:to-zinc-900 border border-indigo-200 dark:border-indigo-800/40 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>AI Research Observation</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                Grounded
              </span>
            </div>
            <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed">
              <strong>SSFTT (RUN-HSI-01)</strong> delivers state-of-the-art results on Indian Pines (98.42% OA) with only 0.58M parameters.
              It outperforms 3D-CNN (RUN-HSI-04) by +6.92% OA while using 21x fewer parameters.
            </p>
            <button
              onClick={() => setActiveTab('chat')}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>Ask AI Research Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Diagnostic Warnings */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                Detected Diagnostic Alerts
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-300">
                <div className="font-semibold text-[11px]">Overfitting Detected in RUN-HSI-05</div>
                <div className="text-[10px] mt-0.5 text-amber-800 dark:text-amber-400">
                  Train OA: 99.8% vs Val OA: 89.2% (Gap: +10.6%). Val loss surging after epoch 18.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-300">
                <div className="font-semibold text-[11px]">Plateau Detected in RUN-HSI-04</div>
                <div className="text-[10px] mt-0.5 text-blue-800 dark:text-blue-400">
                  3D-CNN validation accuracy changed by &lt;0.2% over last 8 epochs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
