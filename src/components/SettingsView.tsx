import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Moon,
  Sun,
  FileCode,
  Sparkles,
  Database,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function SettingsView() {
  const { isDarkMode, toggleDarkMode, toast, refreshData } = useApp();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-500" />
          <span>Platform & Experimentation Settings</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Configure visual themes, REST API access, Gemini AI connections, and reproducibility environments.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Appearance */}
        <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
            Appearance & Workspace Theme
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            DeepLab Analytics is optimized for high-contrast scientific visualization in both dark and light modes.
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={toggleDarkMode}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition-all ${
                !isDarkMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </button>
            <button
              onClick={toggleDarkMode}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition-all ${
                isDarkMode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* REST API & OpenAPI Documentation */}
        <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                REST API & OpenAPI 3.0 Documentation
              </h2>
            </div>
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-mono"
            >
              <span>View openapi.json</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
            All endpoints are strictly validated with Zod schemas and exposed via standard OpenAPI 3.0.
            You can point Swagger UI, Postman, or PhD-Research-Lab client generators directly at <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-blue-600 font-mono">/api/openapi.json</code>.
          </p>
        </div>

        {/* Gemini AI Integration Status */}
        <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Server-Side Gemini AI Research Engine
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
            Configured to run server-side via the modern <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-mono text-emerald-600">@google/genai</code> SDK using model <code className="font-mono font-bold">gemini-2.5-flash</code>.
            AI conclusions are strictly partitioned into Measured Evidence, Derived Calculations, AI Hypotheses, and Controlled Experiments.
          </p>
        </div>

        {/* Data Persistence */}
        <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Persistent Storage Engine
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
            Experiment metadata, epoch histories, confusion matrices, and scientific reports are saved persistently to <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 font-mono">data/deeplab_store.json</code>.
          </p>
          <button
            onClick={async () => {
              await refreshData();
              toast('Refreshed persistent database state from disk', 'success');
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Storage State</span>
          </button>
        </div>
      </div>
    </div>
  );
}
