import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch, remove as apiDelete } from '../services/api';
import { getErrorMessage } from './storeUtils';

export const useMaintenanceStore = create((set, get) => ({
  alerts: [],
  data: [],
  error: null,
  hasLoaded: false,
  history: [],
  isLoading: false,
  fetchAll: async (force = false) => {
    if (get().isLoading || (get().hasLoaded && !force)) {
      return {
        alerts: get().alerts,
        data: get().data,
        history: get().history,
      };
    }

    set({ error: null, isLoading: true });

    try {
      const [data, alerts, history] = await Promise.all([
        apiGet('/maintenance/entries'),
        apiGet('/maintenance/alerts'),
        apiGet('/maintenance/history'),
      ]);

      set({ alerts, data, error: null, hasLoaded: true, history, isLoading: false });
      return { alerts, data, history };
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to load maintenance data.'), isLoading: false });
      throw error;
    }
  },
  add: async (entry) => {
    const created = await apiPost('/maintenance/entries', entry);
    set((state) => ({ data: [created, ...state.data] }));
    return created;
  },
  update: async (id, updates) => {
    const updated = await apiPatch(`/maintenance/entries/${id}`, updates);
    set((state) => ({
      data: state.data.map((entry) => (entry.id === id ? updated : entry)),
    }));
    return updated;
  },
  delete: async (id) => {
    await apiDelete(`/maintenance/entries/${id}`);
    set((state) => ({ data: state.data.filter((entry) => entry.id !== id) }));
  },
  markAlertRead: async (id) => {
    const updated = await apiPatch(`/maintenance/alerts/${id}/read`);
    set((state) => ({
      alerts: state.alerts.map((alert) => (alert.id === id ? updated : alert)),
    }));
    return updated;
  },
  installNow: async (id) => {
    const updated = await apiPatch(`/maintenance/alerts/${id}/install`);
    const history = await apiGet('/maintenance/history');
    set((state) => ({
      alerts: state.alerts.map((alert) => (alert.id === id ? updated : alert)),
      history,
    }));
    return updated;
  },
  scheduleService: async (entry, sourceAlertId) => {
    const response = await apiPost(`/maintenance/alerts/${sourceAlertId}/schedule`, entry);
    const history = await apiGet('/maintenance/history');
    set((state) => ({
      alerts: state.alerts.map((alert) => (alert.id === sourceAlertId ? response.alert : alert)),
      data: [response.entry, ...state.data],
      history,
    }));
    return response;
  },
}));
