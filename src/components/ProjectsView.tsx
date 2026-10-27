import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createProject, deleteProject } from '../api';
import {
  FolderGit2,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Tag,
  Check,
  ChevronRight,
  Database,
  ExternalLink,
} from 'lucide-react';

export default function ProjectsView() {
  const {
    projects,
    runs,
    selectedProjectId,
    setSelectedProjectId,
    refreshData,
    toast,
    setActiveTab,
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<'hyperspectral' | 'computer_vision' | 'multimodal'>('hyperspectral');
  const [dataset, setDataset] = useState('Indian Pines (AVIRIS 200 Bands)');
  const [tagsInput, setTagsInput] = useState('HSI, Transformers, Disjoint-Split');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const newProj = await createProject({
        name,
        description,
        domain,
        dataset,
        tags,
      });
      toast(`Project '${newProj.name}' created successfully!`, 'success');
      setIsCreating(false);
      setName('');
      setDescription('');
      await refreshData();
      setSelectedProjectId(newProj.id);
    } catch (err: any) {
      toast(err.message || 'Failed to create project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, projName: string) => {
    if (!window.confirm(`Are you sure you want to delete project '${projName}' and all its associated experiment runs?`)) {
      return;
    }
    try {
      await deleteProject(id);
      toast(`Project '${projName}' deleted`, 'info');
      if (selectedProjectId === id) {
        setSelectedProjectId('all');
      }
      await refreshData();
    } catch (err: any) {
      toast(err.message || 'Failed to delete project', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
            <FolderGit2 className="w-5 h-5 text-blue-500" />
            <span>Research Projects</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Manage experimental workspaces, benchmark datasets, and multi-model campaign tracking.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Create Project Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                Create Research Project
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Salinas HSI Attention Ablation"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Research Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="hyperspectral">Hyperspectral Image Classification (HSI)</option>
                  <option value="computer_vision">Computer Vision & Deep Learning</option>
                  <option value="multimodal">Multimodal Remote Sensing</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Primary Dataset
                </label>
                <input
                  type="text"
                  required
                  value={dataset}
                  onChange={(e) => setDataset(e.target.value)}
                  placeholder="e.g. Indian Pines, Pavia University, Salinas, Houston 2013"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Description & Scientific Objectives
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe hypothesis, experimental protocol, sample partitioning..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="HSI, ViT, ResNet, 3D-CNN"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => {
          const isSelected = selectedProjectId === proj.id;
          const projRuns = runs.filter((r) => r.project_id === proj.id);
          const bestOA = projRuns.length > 0 ? Math.max(...projRuns.map((r) => r.results.overall_accuracy)) : null;

          return (
            <div
              key={proj.id}
              className={`rounded-xl border p-5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/40 dark:bg-zinc-800/80 border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-semibold uppercase">
                      {proj.domain}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-1">
                      {proj.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDelete(proj.id, proj.name)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-gray-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400">
                    <span>Dataset:</span>
                    <span className="text-gray-800 dark:text-zinc-200 font-semibold truncate max-w-[170px]">
                      {proj.dataset}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400">
                    <span>Recorded Runs:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {projRuns.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400">
                    <span>Top OA:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {bestOA != null ? `${bestOA.toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {proj.tags && proj.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {proj.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    toast(`Selected project: ${proj.name}`, 'info');
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Active Workspace</span>
                    </>
                  ) : (
                    <span>Set Active</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setActiveTab('experiments');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>View Runs</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
