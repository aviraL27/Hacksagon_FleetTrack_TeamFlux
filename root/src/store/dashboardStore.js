import { create } from 'zustand';
import { get as apiGet } from '../services/api';
import { getErrorMessage } from './storeUtils';

export const useDashboardStore = create((set, get) => ({
  error: null,
  hasLoaded: false,
  isLoading: false,
  summary: null,
  fetchSummary: async (force = false) => {
    if (get().isLoading || (get().hasLoaded && !force)) {
      return get().summary;
    }

    set({ error: null, isLoading: true });

    try {
      const summary = await apiGet('/dashboard/summary');
      set({ error: null, hasLoaded: true, isLoading: false, summary });
      return summary;
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to load dashboard summary.'), isLoading: false });
      throw error;
    }
  },
}));
