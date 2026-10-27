import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { fetchReports, createReport, deleteReport } from '../api';
import { ScientificReport } from '../types';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Copy,
  Download,
  Check,
  FileCode,
  FileText,
  Sparkles,
  BookOpen,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { ACADEMIC_STYLES, AcademicStyle, exportSvgAsFile, exportSvgAsPng } from '../utils/exportFigure';

export default function ReportsView() {
  const { runs, selectedProjectId, selectedRunIds, toast } = useApp();
  const [reports, setReports] = useState<ScientificReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ScientificReport | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Figure Studio state
  const [studioFigure, setStudioFigure] = useState<'curves' | 'matrix' | 'pareto'>('curves');
  const [academicStyle, setAcademicStyle] = useState<AcademicStyle>('ieee');
  const [exportingFigure, setExportingFigure] = useState(false);
  const studioSvgRef = useRef<SVGSVGElement | null>(null);

  // New report creation modal state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('Comparative Benchmark & Ablation Study on AVIRIS Indian Pines');
  const [abstract, setAbstract] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const styleConfig = ACADEMIC_STYLES[academicStyle];
  const activeRun = runs.find((r) => selectedRunIds.includes(r.id)) || runs[0];

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchReports(selectedProjectId === 'all' ? undefined : selectedProjectId);
      setReports(data);
      if (data.length > 0 && !activeReport) {
        setActiveReport(data[0]);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to fetch reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedProjectId]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    toast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadCSV = () => {
    const headers = ['Run ID', 'Model', 'Dataset', 'OA (%)', 'AA (%)', 'Kappa', 'Params (M)', 'FLOPs (G)', 'Latency (ms)'];
    const rows = runs.map((r) => [
      r.id,
      `"${r.name}"`,
      `"${r.metadata.dataset}"`,
      r.results.overall_accuracy,
      r.results.average_accuracy,
      r.results.cohens_kappa,
      r.results.params_m ?? '',
      r.results.flops_gflops ?? '',
      r.results.inference_latency_ms ?? '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deeplab_experiments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Downloaded experiments CSV', 'success');
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(runs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `deeplab_benchmark_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
    toast('Downloaded experiments JSON bundle', 'success');
  };

  const handleExportStudioSVG = () => {
    if (!studioSvgRef.current) return;
    const filename = `figure_${studioFigure}_${academicStyle}`;
    exportSvgAsFile(studioSvgRef.current, filename);
    toast(`Exported ${filename}.svg`, 'success');
  };

  const handleExportStudioPNG = async () => {
    if (!studioSvgRef.current) return;
    try {
      setExportingFigure(true);
      const filename = `figure_${studioFigure}_${academicStyle}`;
      await exportSvgAsPng(studioSvgRef.current, filename, 3.0);
      toast(`Exported 300 DPI publication figure (${filename}_300dpi.png)`, 'success');
    } catch (err: any) {
      toast('Failed to export PNG', 'error');
    } finally {
      setExportingFigure(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRuns = selectedRunIds.length > 0
      ? runs.filter((r) => selectedRunIds.includes(r.id))
      : runs.slice(0, 4);

    if (targetRuns.length === 0) {
      toast('Please select at least one run to build a report', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const latexLines = [
        '\\begin{table*}[t]',
        '\\centering',
        `\\caption{Comparative performance on ${targetRuns[0].metadata.dataset} (Disjoint sampling).}`,
        '\\label{tab:deeplab_benchmark}',
        '\\begin{tabular}{lcccccc}',
        '\\hline',
        '\\textbf{Architecture} & \\textbf{OA (\\%)} & \\textbf{AA (\\%)} & \\textbf{Kappa ($\\kappa$)} & \\textbf{Params (M)} & \\textbf{FLOPs (G)} & \\textbf{Latency (ms)} \\\\',
        '\\hline',
      ];

      targetRuns.forEach((r) => {
        latexLines.push(
          `${r.hyperparameters.architecture} & ${r.results.overall_accuracy.toFixed(2)} & ${r.results.average_accuracy.toFixed(2)} & ${r.results.cohens_kappa.toFixed(4)} & ${r.results.params_m ?? 'N/A'} & ${r.results.flops_gflops ?? 'N/A'} & ${r.results.inference_latency_ms ?? 'N/A'} \\\\`
        );
      });

      latexLines.push('\\hline', '\\end{tabular}', '\\end{table*}');
      const latexTable = latexLines.join('\n');

      const findings = targetRuns.map(
        (r) => `${r.name} (${r.id}): Achieved ${r.results.overall_accuracy}% OA and ${r.results.cohens_kappa} Kappa.`
      );

      const markdown = `# ${title}\n\n## Abstract\n${abstract || 'Empirical benchmark evaluating deep learning backbones.'}\n\n## Quantitative Results\n${latexTable}`;

      const newReport = await createReport({
        project_id: selectedProjectId === 'all' ? targetRuns[0].project_id : selectedProjectId,
        title,
        abstract: abstract || `Evaluates ${targetRuns.length} models on ${targetRuns[0].metadata.dataset}.`,
        compared_run_ids: targetRuns.map((r) => r.id),
        findings,
        latex_table: latexTable,
        markdown_content: markdown,
        recommendations: [
          'Adopt the top Pareto frontier model for inference deployment.',
          'Validate spatial patch invariance under noise perturbations.',
        ],
      });

      toast(`Report '${newReport.title}' generated!`, 'success');
      setIsCreating(false);
      await loadReports();
      setActiveReport(newReport);
    } catch (err: any) {
      toast(err.message || 'Failed to generate report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this scientific report?')) return;
    try {
      await deleteReport(id);
      toast('Report deleted', 'info');
      setActiveReport(null);
      await loadReports();
    } catch (err: any) {
      toast(err.message || 'Failed to delete report', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-500" />
            <span>Scientific Report & Paper Figure Generator</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Generate IEEE-style LaTeX tables, markdown ablation summaries, and 300 DPI publication figures.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Main Container: Report List (Left) + Document Viewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Saved Reports List */}
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block font-mono">
            Generated Reports ({reports.length})
          </span>

          <div className="space-y-2">
            {reports.map((rep) => {
              const isActive = activeReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-zinc-800 border-blue-500 shadow-xs'
                      : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="font-bold text-xs text-gray-900 dark:text-zinc-100 line-clamp-1">
                    {rep.title}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono mt-1 flex items-center justify-between">
                    <span>{rep.id}</span>
                    <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Report Details & LaTeX viewer + Figure Studio */}
        <div className="lg:col-span-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 space-y-6 shadow-xs">
          {activeReport ? (
            <>
              {/* Report Header */}
              <div className="flex items-start justify-between border-b border-gray-200 dark:border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                      {activeReport.id}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">
                      Generated: {new Date(activeReport.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-2">
                    {activeReport.title}
                  </h2>
                </div>

                <button
                  onClick={() => handleDelete(activeReport.id)}
                  className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Abstract */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 font-mono mb-1">
                  Abstract & Executive Summary
                </h3>
                <p className="text-xs text-gray-800 dark:text-zinc-200 leading-relaxed bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-lg border border-gray-200 dark:border-zinc-800">
                  {activeReport.abstract}
                </p>
              </div>

              {/* Publication-Ready IEEE LaTeX Table Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-zinc-200 font-mono">
                      IEEE-Style LaTeX Table
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy('latex', activeReport.latex_table)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-mono border border-gray-300 dark:border-zinc-700"
                  >
                    {copiedSection === 'latex' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy LaTeX</span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-gray-950 text-gray-200 text-[11px] font-mono overflow-x-auto border border-gray-800 select-all leading-normal">
                  {activeReport.latex_table}
                </pre>
              </div>

              {/* Publication Figure Studio (NEW) */}
              <div className="p-5 rounded-xl border border-blue-200 dark:border-zinc-800 bg-blue-50/30 dark:bg-zinc-950/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 font-mono">
                      Publication Figure Studio (SVG & 300 DPI PNG)
                    </h3>
                  </div>

                  {/* Figure Type and Style controls */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                      value={studioFigure}
                      onChange={(e) => setStudioFigure(e.target.value as any)}
                      className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-900 dark:text-zinc-100 font-medium"
                    >
                      <option value="curves">Training Loss & Convergence</option>
                      <option value="matrix">Confusion Matrix</option>
                      <option value="pareto">Pareto Frontier Trade-Off</option>
                    </select>

                    <select
                      value={academicStyle}
                      onChange={(e) => setAcademicStyle(e.target.value as AcademicStyle)}
                      className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-900 dark:text-zinc-100 font-medium"
                    >
                      <option value="ieee">IEEE Transactions</option>
                      <option value="nature">Nature / Springer</option>
                      <option value="neurips">NeurIPS Style</option>
                      <option value="monochrome">Monochrome Print</option>
                    </select>

                    <button
                      onClick={handleExportStudioSVG}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 font-medium"
                    >
                      <Download className="w-3 h-3 text-blue-500" />
                      <span>Export SVG</span>
                    </button>

                    <button
                      onClick={handleExportStudioPNG}
                      disabled={exportingFigure}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xs disabled:opacity-50"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>{exportingFigure ? 'Rendering...' : '300 DPI PNG'}</span>
                    </button>
                  </div>
                </div>

                {/* Figure Preview Canvas */}
                <div className="border border-gray-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 p-4 overflow-hidden">
                  <svg
                    ref={studioSvgRef}
                    viewBox="0 0 800 240"
                    className="w-full h-56 select-none"
                    style={{ fontFamily: styleConfig.fontFamily }}
                  >
                    <rect x="0" y="0" width="800" height="240" fill={styleConfig.bgFill} />

                    <text x="50" y="24" className="font-bold text-[12px]" fill={styleConfig.textFill}>
                      Figure: {activeRun.name} — {studioFigure.toUpperCase()} ({styleConfig.name})
                    </text>

                    {/* Simple academic curve preview */}
                    <line x1="50" y1="40" x2="50" y2="200" stroke={styleConfig.axisStroke} strokeWidth="1.5" />
                    <line x1="50" y1="200" x2="760" y2="200" stroke={styleConfig.axisStroke} strokeWidth="1.5" />

                    {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
                      <line
                        key={idx}
                        x1="50"
                        y1={40 + frac * 160}
                        x2="760"
                        y2={40 + frac * 160}
                        stroke={styleConfig.gridStroke}
                        strokeDasharray="4 4"
                      />
                    ))}

                    <polyline
                      fill="none"
                      stroke={styleConfig.trainLine.stroke}
                      strokeWidth={styleConfig.trainLine.strokeWidth}
                      points="50,190 120,150 200,110 320,70 480,50 640,44 760,42"
                    />

                    <polyline
                      fill="none"
                      stroke={styleConfig.valLine.stroke}
                      strokeWidth={styleConfig.valLine.strokeWidth}
                      strokeDasharray={styleConfig.valLine.dasharray || '6 3'}
                      points="50,195 120,160 200,125 320,85 480,68 640,65 760,63"
                    />

                    <text x="405" y="224" textAnchor="middle" className="text-[10px]" fill={styleConfig.subtextFill}>
                      Epoch Index (Grounded in {activeRun.id})
                    </text>
                  </svg>
                </div>
              </div>

              {/* Key Empirical Findings */}
              {activeReport.findings && activeReport.findings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 font-mono">
                    Key Empirical Findings
                  </h3>
                  <ul className="space-y-1.5 text-xs text-gray-800 dark:text-zinc-200 list-disc list-inside">
                    {activeReport.findings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs text-gray-500">
              Select a report from the left panel or click 'New Report' to synthesize findings.
            </div>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                Generate Scientific Report
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Abstract / Summary Notes
                </label>
                <textarea
                  rows={3}
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Summarize the experimental evaluation..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                <span className="font-semibold block mb-1">Models included:</span>
                <span>
                  {selectedRunIds.length > 0 ? selectedRunIds.join(', ') : runs.slice(0, 4).map((r) => r.id).join(', ')}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  {submitting ? 'Synthesizing...' : 'Generate LaTeX & Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
