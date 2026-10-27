import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ExperimentRun } from '../types';
import { fetchProjects, fetchRuns } from '../api';

export type NavTab =
  | 'overview'
  | 'projects'
  | 'experiments'
  | 'compare'
  | 'training'
  | 'hsi'
  | 'chat'
  | 'reports'
  | 'integrations'
  | 'settings';

interface AppContextType {
  projects: Project[];
  runs: ExperimentRun[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedRunIds: string[];
  toggleSelectRun: (id: string) => void;
  clearSelectedRuns: () => void;
  setSelectedRunIds: (ids: string[]) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  inspectRunId: string | null;
  setInspectRunId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  isRegisterOpen: boolean;
  setIsRegisterOpen: (open: boolean) => void;
  isImportOpen: boolean;
  setIsImportOpen: (open: boolean) => void;
  isNewProjectOpen: boolean;
  setIsNewProjectOpen: (open: boolean) => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  activeToasts: { id: string; msg: string; type: 'success' | 'error' | 'info' }[];
  filteredRuns: ExperimentRun[];
  activeProject: Project | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>(['RUN-HSI-01', 'RUN-HSI-02']);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [inspectRunId, setInspectRunId] = useState<string | null>('RUN-HSI-01');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('deeplab_theme') !== 'light';
  });

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [activeToasts, setActiveToasts] = useState<{ id: string; msg: string; type: 'success' | 'error' | 'info' }[]>([]);

  const toast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setActiveToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setActiveToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('deeplab_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, runData] = await Promise.all([fetchProjects(), fetchRuns()]);
      setProjects(projData);
      setRuns(runData);

      // Default selection if empty
      if (projData.length > 0 && selectedProjectId === 'all') {
        setSelectedProjectId(projData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to fetch application data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleSelectRun = (id: string) => {
    setSelectedRunIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const clearSelectedRuns = () => {
    setSelectedRunIds([]);
  };

  const filteredRuns = selectedProjectId === 'all'
    ? runs
    : runs.filter((r) => r.project_id === selectedProjectId);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <AppContext.Provider
      value={{
        projects,
        runs,
        loading,
        error,
        selectedProjectId,
        setSelectedProjectId,
        selectedRunIds,
        toggleSelectRun,
        clearSelectedRuns,
        setSelectedRunIds,
        activeTab,
        setActiveTab,
        isDarkMode,
        toggleDarkMode,
        inspectRunId,
        setInspectRunId,
        refreshData,
        isRegisterOpen,
        setIsRegisterOpen,
        isImportOpen,
        setIsImportOpen,
        isNewProjectOpen,
        setIsNewProjectOpen,
        toast,
        activeToasts,
        filteredRuns,
        activeProject,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
