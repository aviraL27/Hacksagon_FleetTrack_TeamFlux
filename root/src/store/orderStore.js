import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch, remove as apiDelete } from '../services/api';
import { getErrorMessage } from './storeUtils';

function normalizeOrder(order) {
  return {
    ...order,
    auditLogs: order.auditLogs || [],
    position: order.position || [],
    routePath: order.routePath || [],
    speed: order.speed || order.speedLabel || 'Awaiting dispatch',
    speedLabel: order.speedLabel || order.speed || 'Awaiting dispatch',
    id: order.id || order.orderId,
  };
}

export const useOrderStore = create((set, get) => ({
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
      const data = (await apiGet('/orders')).map((order) => normalizeOrder(order));
      set({ data, error: null, hasLoaded: true, isLoading: false });
      return data;
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to load orders.'), isLoading: false });
      throw error;
    }
  },
  add: async (order) => {
    const created = normalizeOrder(await apiPost('/orders', order));
    set((state) => ({ data: [created, ...state.data] }));
    return created;
  },
  updateStatus: async (id, status) => {
    const updated = normalizeOrder(await apiPatch(`/orders/${id}/status`, { status }));
    set((state) => ({
      data: state.data.map((order) => (order.id === id ? updated : order)),
    }));
    return updated;
  },
  assignDriver: async (id, driver) => {
    const updated = normalizeOrder(await apiPatch(`/orders/${id}/assign-driver`, { driver }));
    set((state) => ({
      data: state.data.map((order) => (order.id === id ? updated : order)),
    }));
    return updated;
  },
  applySnapshot: (orders) => {
    set({
      data: orders.map((order) => normalizeOrder(order)),
      hasLoaded: true,
    });
  },
  upsertFromSocket: (payload) => {
    const orderId = payload.id || payload.orderId;

    if (!orderId) {
      return;
    }

    set((state) => {
      const existingOrder = state.data.find((entry) => entry.id === orderId);
      const nextOrder = normalizeOrder({
        ...existingOrder,
        ...payload,
        id: orderId,
        speed: payload.speed || payload.speedLabel || existingOrder?.speed,
        speedLabel: payload.speedLabel || payload.speed || existingOrder?.speedLabel,
      });

      if (!existingOrder) {
        return { data: [nextOrder, ...state.data] };
      }

      return {
        data: state.data.map((entry) => (entry.id === orderId ? nextOrder : entry)),
      };
    });
  },
  delete: async (id) => {
    await apiDelete(`/orders/${id}`);
    set((state) => ({ data: state.data.filter((order) => order.id !== id) }));
  },
}));
