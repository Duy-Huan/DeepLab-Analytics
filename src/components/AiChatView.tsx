import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendChatMessage, analyzeRuns } from '../api';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  FlaskConical,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  referenced_runs?: string[];
  timestamp: string;
}

export default function AiChatView() {
  const { runs, selectedRunIds, selectedProjectId, toast } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am your **DeepLab AI Research Analyst**, grounded directly in your stored experiment runs, metrics, and training curves.

Every conclusion I provide references verified run IDs (e.g. \`RUN-HSI-01\`) and separates:
1. **Measured Evidence**
2. **Derived Calculations**
3. **AI Hypotheses**
4. **Recommended Experiments**

What research questions can I help explore across your models?`,
      referenced_runs: runs.slice(0, 3).map((r) => r.id),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const targetRunIds = selectedRunIds.length > 0 ? selectedRunIds : runs.slice(0, 5).map((r) => r.id);

      const res = await sendChatMessage(
        text,
        targetRunIds,
        history,
        selectedProjectId === 'all' ? undefined : selectedProjectId
      );

      const botMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        referenced_runs: res.runs_referenced,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      toast(err.message || 'Failed to get AI response', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunFormalAnalysis = async (focus: string) => {
    const targetRunIds = selectedRunIds.length > 0 ? selectedRunIds : runs.slice(0, 4).map((r) => r.id);
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `Run formal 4-tier scientific analysis with focus: ${focus.toUpperCase()} across [${targetRunIds.join(', ')}]`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await analyzeRuns(targetRunIds, focus);
      const formatted = `### Formal Scientific Experiment Analysis (${focus.toUpperCase()})

#### 1. Measured Evidence
${res.measured_evidence.map((m) => `- ${m}`).join('\n')}

#### 2. Derived Calculations
${res.derived_calculations.map((d) => `- ${d}`).join('\n')}

#### 3. AI Hypotheses
${res.ai_hypotheses.map((h) => `- ${h}`).join('\n')}

#### 4. Recommended Controlled Experiments
${res.recommended_experiments.map((e) => `- ${e}`).join('\n')}`;

      const botMsg: ChatMessage = {
        id: `msg-analysis-${Date.now()}`,
        role: 'assistant',
        content: formatted,
        referenced_runs: targetRunIds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      toast(err.message || 'Analysis failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Response copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      {/* Top Bar with Grounded Context */}
      <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
            Gemini AI Research Assistant
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
            Server-Side Grounded
          </span>
        </div>

        {/* Active Runs in Context */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-gray-400 font-mono text-[11px]">Context:</span>
          {(selectedRunIds.length > 0 ? selectedRunIds : runs.slice(0, 3).map((r) => r.id)).map((id) => (
            <span
              key={id}
              className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-semibold"
            >
              {id}
            </span>
          ))}
        </div>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/50 flex flex-wrap gap-2 text-xs shrink-0">
        <button
          onClick={() => handleSend('Why is my model overfitting?')}
          className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors"
        >
          Overfitting Diagnosis?
        </button>
        <button
          onClick={() => handleSend('Which experiment achieved the highest OA and lowest compute footprint?')}
          className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors"
        >
          Highest OA & Efficiency?
        </button>
        <button
          onClick={() => handleSend('Compare SSFTT (RUN-HSI-01) and 3D-CNN (RUN-HSI-04) in detail.')}
          className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 transition-colors"
        >
          Compare SSFTT vs 3D-CNN
        </button>
        <button
          onClick={() => handleRunFormalAnalysis('ablation')}
          className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 transition-colors"
        >
          Generate Ablation Study Matrix
        </button>
        <button
          onClick={() => handleSend('Summarize experimental evidence for an IEEE conference paper.')}
          className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-100 transition-colors"
        >
          Draft Paper Summary
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-4 text-xs space-y-2 leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 text-gray-800 dark:text-zinc-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-mono">
                  <span>{isUser ? 'You' : 'DeepLab Research Analyst'}</span>
                  <span>{m.timestamp}</span>
                </div>

                {/* Content with whitespace formatting and tables */}
                <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                  {m.content}
                </div>

                {/* Referenced Runs Footnote & Copy */}
                {!isUser && (
                  <div className="pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-1.5 text-gray-500 dark:text-zinc-400 font-mono">
                      <span>Referenced:</span>
                      {m.referenced_runs && m.referenced_runs.map((rId) => (
                        <span key={rId} className="px-1 py-0.2 bg-gray-200 dark:bg-zinc-700 rounded">
                          {rId}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500"
                      title="Copy response"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800 text-xs text-gray-500 dark:text-zinc-400 font-mono animate-pulse">
              Synthesizing grounded research evidence across active runs...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask research questions grounded in your experiment results (e.g. Which model should I choose for UAV deployment?)..."
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
