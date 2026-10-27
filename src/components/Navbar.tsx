import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Moon,
  Sun,
  Plus,
  UploadCloud,
  Split,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedRunIds,
    activeTab,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    setIsRegisterOpen,
    setIsImportOpen,
    runs,
  } = useApp();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setActiveTab('overview')}
          className="flex items-center space-x-2.5 text-left focus:outline-none group"
          aria-label="DeepLab Analytics Home"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight text-gray-900 dark:text-zinc-100">
                DeepLab
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
                Analytics
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400 hidden sm:block">
              Hyperspectral & Deep Learning Platform
            </p>
          </div>
        </button>

        {/* Project Selector */}
        <div className="h-6 w-[1px] bg-gray-200 dark:bg-zinc-800 hidden md:block" />

        <div className="hidden sm:flex items-center space-x-2">
          <label htmlFor="project-select" className="text-xs font-medium text-gray-500 dark:text-zinc-400">
            Project:
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-medium bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="all">All Projects ({runs.length} runs)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {selectedRunIds.length > 0 && (
          <button
            onClick={() => setActiveTab('compare')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Compare ({selectedRunIds.length})</span>
          </button>
        )}

        <button
          onClick={() => setIsImportOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition-colors"
          title="Import CSV, JSON, or TensorBoard log"
        >
          <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden xs:inline">Import</span>
        </button>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
          title="Register new training run"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Run</span>
        </button>

        <div className="h-6 w-[1px] bg-gray-200 dark:bg-zinc-800" />

        {/* Gemini Ready status indicator */}
        <div
          onClick={() => setActiveTab('chat')}
          className="cursor-pointer hidden lg:flex items-center space-x-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-medium"
          title="Server-side Gemini Analyst is active"
        >
          <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Gemini-2.5</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
