import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch, remove as apiDelete } from '../services/api';
import { cloneValue, getErrorMessage } from './storeUtils';

const defaultProfile = {
  domainPrefix: '',
  headquartersAddress: '',
  legalEntityName: '',
};

const defaultResponsibilitiesByRole = {
  'Super Admin': ['Dashboard', 'Settings', 'Live Tracking'],
  'Operations Manager': ['Orders', 'Drivers', 'Live Tracking'],
  'Fleet Dispatcher': ['Fleet', 'Orders', 'Live Tracking'],
  'Billing Manager': ['Billing', 'Orders', 'Settings'],
  'Maintenance Lead': ['Maintenance', 'Fleet'],
  'Driver Coordinator': ['Drivers', 'Orders'],
};

function getDefaultResponsibilities(role = '') {
  return defaultResponsibilitiesByRole[role] || ['Orders', 'Live Tracking'];
}

function normalizeProfile(profile) {
  return {
    ...defaultProfile,
    ...(profile || {}),
  };
}

function normalizeTeamMember(member) {
  const role = String(member?.role || 'Operations Manager');
  const responsibilities =
    Array.isArray(member?.responsibilities) && member.responsibilities.length
      ? member.responsibilities
      : getDefaultResponsibilities(role);

  return {
    ...member,
    assignedHub: member?.assignedHub || (member?.isOwner ? 'Global Operations' : 'Unassigned'),
    lastLogin: member?.lastLogin || 'Invitation sent',
    lastLoginDetail: member?.lastLoginDetail || 'Awaiting first login',
    notes: member?.notes || '',
    phone: member?.phone || '',
    responsibilities,
    role,
    status: member?.status || 'Pending',
  };
}

export const useTeamStore = create((set, get) => ({
  data: [],
  draftProfile: null,
  error: null,
  hasLoaded: false,
  isLoading: false,
  profile: null,
  clearError: () => {
    set({ error: null });
  },
  fetchAll: async (force = false) => {
    if (get().isLoading || (get().hasLoaded && !force)) {
      return {
        data: get().data,
        draftProfile: get().draftProfile,
        profile: get().profile,
      };
    }

    set({ error: null, isLoading: true });

    try {
      const [profileResponse, teamResponse] = await Promise.all([apiGet('/settings/profile'), apiGet('/settings/team')]);
      const profile = normalizeProfile(profileResponse);
      const data = Array.isArray(teamResponse) ? teamResponse.map((member) => normalizeTeamMember(member)) : [];

      set({
        data,
        draftProfile: cloneValue(profile),
        error: null,
        hasLoaded: true,
        isLoading: false,
        profile,
      });

      return { data, draftProfile: profile, profile };
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to load organization settings.'), isLoading: false });
      throw error;
    }
  },
  add: async (member) => {
    set({ error: null });

    try {
      const created = normalizeTeamMember(await apiPost('/settings/team', member));
      set((state) => ({ data: [created, ...state.data], error: null }));
      return created;
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to add a team member.') });
      throw error;
    }
  },
  updateMember: async (id, updates) => {
    set({ error: null });

    try {
      const updated = normalizeTeamMember(await apiPatch(`/settings/team/${id}`, updates));
      set((state) => ({
        data: state.data.map((member) => (member.id === id ? updated : member)),
        error: null,
      }));
      return updated;
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to update the team member.') });
      throw error;
    }
  },
  deleteMember: async (id) => {
    set({ error: null });

    try {
      await apiDelete(`/settings/team/${id}`);
      set((state) => ({
        data: state.data.filter((member) => member.id !== id),
        error: null,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to remove the team member.') });
      throw error;
    }
  },
  updateDraft: (field, value) => {
    set((state) => ({
      draftProfile: {
        ...state.draftProfile,
        [field]: value,
      },
    }));
  },
  saveChanges: async () => {
    set({ error: null });

    try {
      const updated = normalizeProfile(await apiPatch('/settings/profile', get().draftProfile));
      set({ draftProfile: cloneValue(updated), profile: updated, error: null });
      return updated;
    } catch (error) {
      set({ error: getErrorMessage(error, 'Unable to save organization settings.') });
      throw error;
    }
  },
  discardChanges: () => {
    set((state) => ({ draftProfile: cloneValue(state.profile) }));
  },
}));
