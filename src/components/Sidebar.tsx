import React from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  LayoutDashboard,
  FolderGit2,
  FlaskConical,
  GitCompare,
  TrendingUp,
  Boxes,
  MessageSquareCode,
  FileSpreadsheet,
  Cable,
  Settings,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function Sidebar() {
  const { activeTab, setActiveTab, runs, selectedRunIds } = useApp();

  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 className="w-4 h-4" /> },
    {
      id: 'experiments',
      label: 'Experiments',
      icon: <FlaskConical className="w-4 h-4" />,
      badge: runs.length,
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    },
    {
      id: 'compare',
      label: 'Compare Models',
      icon: <GitCompare className="w-4 h-4" />,
      badge: selectedRunIds.length > 0 ? selectedRunIds.length : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    },
    { id: 'training', label: 'Training Analytics', icon: <TrendingUp className="w-4 h-4" /> },
    {
      id: 'hsi',
      label: 'HSI Analysis',
      icon: <Boxes className="w-4 h-4 text-emerald-500" />,
      badge: 'Core',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-mono',
    },
    {
      id: 'chat',
      label: 'AI Research Chat',
      icon: <MessageSquareCode className="w-4 h-4 text-cyan-500" />,
      badge: 'AI',
      badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 font-mono',
    },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Cable className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/50 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-gray-400 dark:text-zinc-500 font-mono">
          Research Console
        </div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isActive ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dataset & Demo Notice footer */}
      <div className="p-3 border-t border-gray-200 dark:border-zinc-800 space-y-2">
        <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-zinc-800/80 border border-blue-100 dark:border-zinc-700/60">
          <div className="flex items-center space-x-1.5 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grounding Assurance</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-zinc-400 mt-1 leading-snug">
            All AI insights cite strictly recorded run IDs, metrics, and loss history.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] px-1 text-gray-400 dark:text-zinc-500 font-mono">
          <span>v1.0.0-PROD</span>
          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 text-[10px] font-semibold">
            DEMO SEEDED
          </span>
        </div>
      </div>
    </aside>
  );
}
