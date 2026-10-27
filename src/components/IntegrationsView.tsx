import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchIntegrations, testIntegration } from '../api';
import { IntegrationConfig } from '../types';
import {
  Cable,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Copy,
  Check,
  Send,
  Code2,
  Terminal,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function IntegrationsView() {
  const { toast } = useApp();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; connected: boolean; latency?: number } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations().then(setIntegrations).catch(console.error);
  }, []);

  const handleTest = async (item: IntegrationConfig) => {
    try {
      setTestingId(item.id);
      const res = await testIntegration(item.id);
      setTestResult({
        id: item.id,
        message: res.message,
        connected: res.connected,
        latency: res.latency_ms,
      });
      toast(res.message, res.connected ? 'success' : 'info');
    } catch (err: any) {
      toast(err.message || 'Connection test failed', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    toast('Code snippet copied to clipboard', 'info');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const colabSnippet = `# DeepLab Analytics Google Colab Logging Snippet
import requests
import json

DEEPLAB_ENDPOINT = "https://your-deeplab-instance.app/api/runs/import"

def log_experiment_to_deeplab(project_id, run_name, epochs_data, final_metrics):
    payload = {
        "project_id": project_id,
        "format": "json",
        "override_name": run_name,
        "payload": json.dumps({
            "name": run_name,
            "architecture": "SSFTT-Colab",
            "results": final_metrics,
            "epochs": epochs_data
        })
    }
    resp = requests.post(DEEPLAB_ENDPOINT, json=payload)
    print("Logged to DeepLab:", resp.status_code, resp.json().get("id"))`;

  const pytorchHookSnippet = `# DeepLab PyTorch Training Hook (PyTorch Lightning / Pure Torch)
import requests

class DeepLabCallback:
    def __init__(self, endpoint="http://localhost:3000/api/runs/import", project_id="proj-indian-pines"):
        self.endpoint = endpoint
        self.project_id = project_id
        self.history = []

    def on_epoch_end(self, epoch, train_loss, val_loss, train_oa, val_oa, lr):
        self.history.append({
            "epoch": epoch,
            "train_loss": float(train_loss),
            "val_loss": float(val_loss),
            "train_oa": float(train_oa),
            "val_oa": float(val_oa),
            "learning_rate": float(lr)
        })

    def on_train_end(self, run_name):
        requests.post(self.endpoint, json={
            "project_id": self.project_id,
            "format": "json",
            "override_name": run_name,
            "payload": str(self.history).replace("'", '"')
        })`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center space-x-2">
          <Cable className="w-5 h-5 text-blue-500" />
          <span>External Integration Architecture</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Real adapters for PhD-Research-Lab, Hermes Agent, Google Colab, PyTorch hooks, and TensorBoard logs.
        </p>
      </div>

      {/* Grid of 6 Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => {
          const isConnected = item.status === 'connected';
          const isConfigured = item.status === 'configured';
          const isTesting = testingId === item.id;
          const currentTest = testResult?.id === item.id ? testResult : null;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100">
                    {item.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      isConnected
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isConfigured
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                  {item.details}
                </p>

                {item.endpoint_url && (
                  <div className="text-[11px] font-mono text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/60 p-2 rounded truncate">
                    Endpoint: {item.endpoint_url}
                  </div>
                )}

                {currentTest && (
                  <div
                    className={`p-2.5 rounded-lg text-[11px] font-mono ${
                      currentTest.connected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                    }`}
                  >
                    <div>{currentTest.message}</div>
                    {currentTest.latency && <div>Latency: {currentTest.latency}ms</div>}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-mono">
                  {item.last_sync ? `Sync: ${new Date(item.last_sync).toLocaleTimeString()}` : 'Disconnected'}
                </span>

                <button
                  onClick={() => handleTest(item)}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'Pinging...' : 'Test Connection'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Code Snippets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Colab Snippet */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                Google Colab Experiment Streamer
              </h3>
            </div>
            <button
              onClick={() => handleCopy('colab', colabSnippet)}
              className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono"
            >
              {copiedSnippet === 'colab' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>Copy Python</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-gray-900 text-gray-200 text-[11px] font-mono overflow-x-auto leading-normal">
            {colabSnippet}
          </pre>
        </div>

        {/* PyTorch Hook Snippet */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                PyTorch Native Callback
              </h3>
            </div>
            <button
              onClick={() => handleCopy('pytorch', pytorchHookSnippet)}
              className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono"
            >
              {copiedSnippet === 'pytorch' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>Copy Callback</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-gray-900 text-gray-200 text-[11px] font-mono overflow-x-auto leading-normal">
            {pytorchHookSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
