import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch, remove as apiDelete } from '../services/api';
import { getErrorMessage } from './storeUtils';

export const useDriverStore = create((set, get) => ({
  data: [],
  error: null,
  hasLoaded: false,
  isLoading: false,
  fetchAll: async (force = false) => {
    if (get().isLoading || (get().hasLoaded && !force)) {
      return get().data;
    }

    set({ error: null, isLoading: true });

    try {
      const data = await apiGet('/drivers');
      set({ data, error: null, hasLoaded: true, isLoading: false });
      return data;
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to load drivers.'), isLoading: false });
      throw error;
    }
  },
  add: async (driver) => {
    const created = await apiPost('/drivers', driver);
    set((state) => ({ data: [created, ...state.data] }));
    return created;
  },
  update: async (id, updates) => {
    const updated = await apiPatch(`/drivers/${id}`, updates);
    set((state) => ({
      data: state.data.map((driver) => (driver.id === id ? updated : driver)),
    }));
    return updated;
  },
  delete: async (id) => {
    await apiDelete(`/drivers/${id}`);
    set((state) => ({ data: state.data.filter((driver) => driver.id !== id) }));
  },
  reset: async () => get().fetchAll(true),
}));
