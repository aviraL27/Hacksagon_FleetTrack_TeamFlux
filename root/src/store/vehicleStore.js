import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch, remove as apiDelete } from '../services/api';
import { getErrorMessage } from './storeUtils';

export const useVehicleStore = create((set, get) => ({
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
      const data = await apiGet('/vehicles');
      set({ data, error: null, hasLoaded: true, isLoading: false });
      return data;
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to load vehicles.'), isLoading: false });
      throw error;
    }
  },
  add: async (vehicle) => {
    const created = await apiPost('/vehicles', vehicle);
    set((state) => ({ data: [created, ...state.data] }));
    return created;
  },
  update: async (id, updates) => {
    const updated = await apiPatch(`/vehicles/${id}`, updates);
    set((state) => ({
      data: state.data.map((vehicle) => (vehicle.id === id ? updated : vehicle)),
    }));
    return updated;
  },
  delete: async (id) => {
    await apiDelete(`/vehicles/${id}`);
    set((state) => ({ data: state.data.filter((vehicle) => vehicle.id !== id) }));
  },
  reset: async () => get().fetchAll(true),
}));
