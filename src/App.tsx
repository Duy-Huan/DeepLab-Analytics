/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewView from './components/OverviewView';
import ProjectsView from './components/ProjectsView';
import ExperimentsView from './components/ExperimentsView';
import CompareView from './components/CompareView';
import TrainingAnalyticsView from './components/TrainingAnalyticsView';
import HsiAnalysisView from './components/HsiAnalysisView';
import AiChatView from './components/AiChatView';
import ReportsView from './components/ReportsView';
import IntegrationsView from './components/IntegrationsView';
import SettingsView from './components/SettingsView';
import RegisterRunModal from './components/RegisterRunModal';
import ImportRunModal from './components/ImportRunModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

function MainContent() {
  const { activeTab, activeToasts, loading } = useApp();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Navbar />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500 font-mono">Loading DeepLab Analytics workspace...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewView />}
              {activeTab === 'projects' && <ProjectsView />}
              {activeTab === 'experiments' && <ExperimentsView />}
              {activeTab === 'compare' && <CompareView />}
              {activeTab === 'training' && <TrainingAnalyticsView />}
              {activeTab === 'hsi' && <HsiAnalysisView />}
              {activeTab === 'chat' && <AiChatView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'integrations' && <IntegrationsView />}
              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <RegisterRunModal />
      <ImportRunModal />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {activeToasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-medium shadow-lg border transition-all ${
              t.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : t.type === 'error'
                ? 'bg-red-900/90 text-white border-red-700'
                : 'bg-gray-900/90 text-white border-gray-700'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
