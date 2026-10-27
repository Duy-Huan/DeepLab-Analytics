import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { importRun } from '../api';
import { UploadCloud, X, FileText, CheckCircle2, Sparkles } from 'lucide-react';

const CSV_SAMPLE = `epoch,train_loss,val_loss,train_oa,val_oa,learning_rate
1,1.820,1.910,48.2,46.5,0.001000
2,1.240,1.380,66.1,64.0,0.000980
3,0.850,0.920,78.4,76.2,0.000950
4,0.560,0.680,86.2,83.9,0.000900
5,0.380,0.490,91.0,88.5,0.000840
6,0.250,0.370,94.2,91.8,0.000760
7,0.170,0.290,96.5,93.9,0.000670
8,0.110,0.240,97.8,95.1,0.000570
9,0.080,0.200,98.6,96.0,0.000460
10,0.055,0.175,99.1,96.6,0.000350
11,0.038,0.160,99.4,97.0,0.000250
12,0.026,0.150,99.6,97.3,0.000160
13,0.019,0.145,99.7,97.4,0.000080
14,0.015,0.142,99.8,97.5,0.000030
15,0.012,0.140,99.9,97.6,0.000005`;

const JSON_SAMPLE = `[
  {"epoch": 1, "train_loss": 1.75, "val_loss": 1.82, "train_oa": 52.0, "val_oa": 50.1, "learning_rate": 0.001},
  {"epoch": 2, "train_loss": 1.10, "val_loss": 1.25, "train_oa": 71.5, "val_oa": 69.0, "learning_rate": 0.0009},
  {"epoch": 3, "train_loss": 0.65, "val_loss": 0.78, "train_oa": 84.0, "val_oa": 81.5, "learning_rate": 0.0007},
  {"epoch": 4, "train_loss": 0.35, "val_loss": 0.45, "train_oa": 92.5, "val_oa": 90.0, "learning_rate": 0.0005},
  {"epoch": 5, "train_loss": 0.18, "val_loss": 0.28, "train_oa": 96.8, "val_oa": 94.7, "learning_rate": 0.0003},
  {"epoch": 6, "train_loss": 0.08, "val_loss": 0.19, "train_oa": 98.9, "val_oa": 96.5, "learning_rate": 0.0001}
]`;

export default function ImportRunModal() {
  const { isImportOpen, setIsImportOpen, projects, selectedProjectId, refreshData, toast, setActiveTab, setInspectRunId } = useApp();

  const [projectId, setProjectId] = useState(
    selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || ''
  );
  const [format, setFormat] = useState<'csv' | 'json' | 'tensorboard'>('csv');
  const [overrideName, setOverrideName] = useState('Imported-PyTorch-SSFTT');
  const [payload, setPayload] = useState(CSV_SAMPLE);
  const [submitting, setSubmitting] = useState(false);

  if (!isImportOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload.trim()) return;

    try {
      setSubmitting(true);
      const imported = await importRun({
        project_id: projectId || projects[0]?.id,
        format,
        payload,
        override_name: overrideName.trim() || undefined,
      });

      toast(`Successfully imported run '${imported.name}' (${imported.id})!`, 'success');
      setIsImportOpen(false);
      await refreshData();
      setInspectRunId(imported.id);
      setActiveTab('training');
    } catch (err: any) {
      toast(err.message || 'Import failed. Verify CSV or JSON syntax.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">
              Import Training Run Results
            </h3>
          </div>
          <button
            onClick={() => setIsImportOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleImport} className="space-y-4 text-xs">
          {/* Target Project & Run Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Target Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Imported Run Name
              </label>
              <input
                type="text"
                value={overrideName}
                onChange={(e) => setOverrideName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Format Selector & Presets */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700 dark:text-zinc-300">Format:</span>
              <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-gray-100 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setFormat('csv');
                    setPayload(CSV_SAMPLE);
                  }}
                  className={`px-2.5 py-1 rounded text-xs ${
                    format === 'csv' ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  CSV Log
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormat('json');
                    setPayload(JSON_SAMPLE);
                  }}
                  className={`px-2.5 py-1 rounded text-xs ${
                    format === 'json' ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  JSON Bundle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormat('tensorboard');
                    setPayload(CSV_SAMPLE);
                  }}
                  className={`px-2.5 py-1 rounded text-xs ${
                    format === 'tensorboard' ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 dark:text-zinc-400'
                  }`}
                >
                  TensorBoard CSV
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPayload(format === 'json' ? JSON_SAMPLE : CSV_SAMPLE)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Load Sample Data
            </button>
          </div>

          {/* Payload textarea */}
          <div>
            <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1 font-mono">
              Raw Payload ({format.toUpperCase()})
            </label>
            <textarea
              rows={8}
              required
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-900 text-gray-100 font-mono text-[11px] leading-snug focus:outline-none"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-[11px] font-mono leading-relaxed">
            Automatic derived calculations: Final validation OA, AA, Cohen's Kappa, and deterministic diagnostics (overfitting, divergence, stability) will be calculated upon import.
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
            >
              {submitting ? 'Parsing...' : 'Execute Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
