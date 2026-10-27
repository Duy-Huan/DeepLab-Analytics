import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { deleteRun } from '../api';
import {
  FlaskConical,
  Search,
  Filter,
  Plus,
  UploadCloud,
  Split,
  Trash2,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

export default function ExperimentsView() {
  const {
    runs,
    selectedProjectId,
    selectedRunIds,
    setSelectedRunIds,
    toggleSelectRun,
    clearSelectedRuns,
    setActiveTab,
    setInspectRunId,
    setIsRegisterOpen,
    setIsImportOpen,
    refreshData,
    toast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'running' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'oa' | 'created' | 'params' | 'latency'>('oa');
  const [sortDesc, setSortDesc] = useState(true);

  const displayedRuns = runs
    .filter((r) => {
      if (selectedProjectId !== 'all' && r.project_id !== selectedProjectId) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(query);
        const matchesId = r.id.toLowerCase().includes(query);
        const matchesArch = r.hyperparameters.architecture.toLowerCase().includes(query);
        const matchesDataset = r.metadata.dataset.toLowerCase().includes(query);
        return matchesName || matchesId || matchesArch || matchesDataset;
      }
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'oa') {
        diff = a.results.overall_accuracy - b.results.overall_accuracy;
      } else if (sortBy === 'created') {
        diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'params') {
        diff = (a.results.params_m ?? 0) - (b.results.params_m ?? 0);
      } else if (sortBy === 'latency') {
        diff = (a.results.inference_latency_ms ?? 0) - (b.results.inference_latency_ms ?? 0);
      }
      return sortDesc ? -diff : diff;
    });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete experiment run '${name}' (${id})?`)) return;
    try {
      await deleteRun(id);
      toast(`Run ${id} deleted`, 'info');
      await refreshData();
    } catch (err: any) {
      toast(err.message || 'Failed to delete run', 'error');
    }
  };

  const handleSelectAll = () => {
    if (selectedRunIds.length === displayedRuns.length) {
      clearSelectedRuns();
    } else {
      displayedRuns.forEach((r) => {
        if (!selectedRunIds.includes(r.id)) toggleSelectRun(r.id);
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-blue-500" />
            <span>Experiment Manager</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Tracking {displayedRuns.length} registered training runs with hyperparameters, seeds, and metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedRunIds.length >= 2 && (
            <button
              onClick={() => setActiveTab('compare')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Compare Selected ({selectedRunIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
            <span>Import (CSV/JSON)</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Run</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by run name, ID, architecture, or dataset..."
            className="w-full bg-transparent border-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="oa">Overall Accuracy (OA)</option>
              <option value="created">Created Date</option>
              <option value="params">Parameter Count</option>
              <option value="latency">Inference Latency</option>
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="p-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-zinc-100"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={displayedRuns.length > 0 && selectedRunIds.length === displayedRuns.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-3 font-semibold">Run ID & Model</th>
                <th className="p-3 font-semibold">Dataset & Setup</th>
                <th className="p-3 font-semibold text-right">OA (%)</th>
                <th className="p-3 font-semibold text-right">AA (%)</th>
                <th className="p-3 font-semibold text-right">Kappa</th>
                <th className="p-3 font-semibold text-right">Params</th>
                <th className="p-3 font-semibold text-right">FLOPs</th>
                <th className="p-3 font-semibold text-right">Latency</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
              {displayedRuns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400 dark:text-zinc-500">
                    No experiment runs match the current criteria.
                  </td>
                </tr>
              ) : (
                displayedRuns.map((r) => {
                  const isSelected = selectedRunIds.includes(r.id);
                  const hasAlert = r.diagnostics && r.diagnostics.some((d) => d.severity === 'high');

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-blue-50/30 dark:hover:bg-zinc-800/40 transition-colors ${
                        isSelected ? 'bg-blue-50/50 dark:bg-zinc-800/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRun(r.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Run ID & Model */}
                      <td className="p-3 min-w-[200px]">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">
                            {r.name}
                          </span>
                          {r.is_demo && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-mono font-semibold">
                              DEMO
                            </span>
                          )}
                          {hasAlert && (
                            <span
                              className="text-[9px] px-1 py-0.2 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-mono font-semibold cursor-help"
                              title="High diagnostic alert detected on curves"
                            >
                              ALERT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-gray-500 dark:text-zinc-400 font-mono mt-0.5">
                          <span>{r.id}</span>
                          <span>•</span>
                          <span>{r.hyperparameters.architecture}</span>
                          {r.metadata.seed !== undefined && (
                            <span>• seed={r.metadata.seed}</span>
                          )}
                        </div>
                      </td>

                      {/* Dataset & Setup */}
                      <td className="p-3 text-gray-700 dark:text-zinc-300">
                        <div className="font-medium truncate max-w-[150px]">{r.metadata.dataset}</div>
                        <div className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                          {r.metadata.spatial_size ? `Patch: ${r.metadata.spatial_size}` : ''}
                          {r.metadata.spectral_bands ? ` (${r.metadata.spectral_bands} bands)` : ''}
                        </div>
                      </td>

                      {/* OA */}
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {r.results.overall_accuracy.toFixed(2)}%
                      </td>

                      {/* AA */}
                      <td className="p-3 text-right font-mono text-gray-700 dark:text-zinc-300">
                        {r.results.average_accuracy.toFixed(2)}%
                      </td>

                      {/* Kappa */}
                      <td className="p-3 text-right font-mono text-gray-700 dark:text-zinc-300">
                        {r.results.cohens_kappa.toFixed(4)}
                      </td>

                      {/* Params */}
                      <td className="p-3 text-right font-mono text-gray-700 dark:text-zinc-300">
                        {r.results.params_m != null ? `${r.results.params_m}M` : '—'}
                      </td>

                      {/* FLOPs */}
                      <td className="p-3 text-right font-mono text-gray-700 dark:text-zinc-300">
                        {r.results.flops_gflops != null ? `${r.results.flops_gflops}G` : '—'}
                      </td>

                      {/* Latency */}
                      <td className="p-3 text-right font-mono text-gray-700 dark:text-zinc-300">
                        {r.results.inference_latency_ms != null ? `${r.results.inference_latency_ms}ms` : '—'}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${
                            r.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : r.status === 'running'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 animate-pulse'
                              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          }`}
                        >
                          {r.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          <span>{r.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setInspectRunId(r.id);
                              setActiveTab('training');
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400"
                            title="Inspect Training Curves & Epoch Metrics"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedRunIds([r.id]);
                              setActiveTab('chat');
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-cyan-600 dark:text-cyan-400"
                            title="Analyze this run with AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(r.id, r.name)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            title="Delete Run"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
