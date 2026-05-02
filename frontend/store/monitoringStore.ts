import { create } from 'zustand';

interface MonitoringUiState {
  reportsTimeRange: number;
  deviceDetailTab: number;
  timelineFilter: 'all' | 'active' | 'idle';
  recordingsPage: number;
  recordingsRowsPerPage: number;
  setReportsTimeRange: (value: number) => void;
  setDeviceDetailTab: (value: number) => void;
  setTimelineFilter: (value: 'all' | 'active' | 'idle') => void;
  setRecordingsPage: (value: number) => void;
  setRecordingsRowsPerPage: (value: number) => void;
}

export const useMonitoringStore = create<MonitoringUiState>((set) => ({
  reportsTimeRange: 24,
  deviceDetailTab: 0,
  timelineFilter: 'all',
  recordingsPage: 0,
  recordingsRowsPerPage: 10,
  setReportsTimeRange: (value) => set({ reportsTimeRange: value }),
  setDeviceDetailTab: (value) => set({ deviceDetailTab: value }),
  setTimelineFilter: (value) => set({ timelineFilter: value }),
  setRecordingsPage: (value) => set({ recordingsPage: value }),
  setRecordingsRowsPerPage: (value) => set({ recordingsRowsPerPage: value }),
}));
