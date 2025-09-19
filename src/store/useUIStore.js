import { create } from 'zustand';

/**
 * UI Store
 * Manages application-wide UI state
 * Enhanced with comprehensive state management patterns
 */
const useUIStore = create((set, get) => ({
  // Loading states
  isLoading: false,
  loadingStates: {
    silos: false,
    inbound: false,
    outbound: false,
    materials: false,
    operators: false,
    reports: false,
  },
  
  // Form states
  forms: {
    siloForm: { isOpen: false, editingItem: null },
    inboundForm: { isOpen: false, editingItem: null },
    outboundForm: { isOpen: false, editingItem: null },
  },
  
  // Filter states
  filters: {
    dateRange: { startDate: '', endDate: '' },
    siloFilter: 'all',
    reportType: 'movements',
  },
  
  // Notification states
  notifications: {
    success: null,
    error: null,
    warning: null,
    info: null,
  },
  
  // Modal states
  modals: {
    confirmDialog: { isOpen: false, title: '', message: '', onConfirm: null },
    deleteDialog: { isOpen: false, item: null, onConfirm: null },
  },
  
  // Actions - Loading states
  setLoading: (loading) => set({ isLoading: loading }),
  
  setLoadingState: (key, loading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading }
  })),
  
  setMultipleLoadingStates: (states) => set((state) => ({
    loadingStates: { ...state.loadingStates, ...states }
  })),
  
  // Actions - Form states
  openForm: (formType, editingItem = null) => set((state) => ({
    forms: { ...state.forms, [formType]: { isOpen: true, editingItem } }
  })),
  
  closeForm: (formType) => set((state) => ({
    forms: { ...state.forms, [formType]: { isOpen: false, editingItem: null } }
  })),
  
  // Actions - Filter states
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  
  resetFilters: () => set({
    filters: {
      dateRange: { startDate: '', endDate: '' },
      siloFilter: 'all',
      reportType: 'movements',
    }
  }),
  
  // Actions - Notification states
  setNotification: (type, message) => set((state) => ({
    notifications: { ...state.notifications, [type]: message }
  })),
  
  clearNotification: (type) => set((state) => ({
    notifications: { ...state.notifications, [type]: null }
  })),
  
  clearAllNotifications: () => set({
    notifications: { success: null, error: null, warning: null, info: null }
  }),
  
  // Actions - Modal states
  showConfirmDialog: (title, message, onConfirm) => set((state) => ({
    modals: { 
      ...state.modals, 
      confirmDialog: { isOpen: true, title, message, onConfirm } 
    }
  })),
  
  hideConfirmDialog: () => set((state) => ({
    modals: { 
      ...state.modals, 
      confirmDialog: { isOpen: false, title: '', message: '', onConfirm: null } 
    }
  })),
  
  showDeleteDialog: (item, onConfirm) => set((state) => ({
    modals: { 
      ...state.modals, 
      deleteDialog: { isOpen: true, item, onConfirm } 
    }
  })),
  
  hideDeleteDialog: () => set((state) => ({
    modals: { 
      ...state.modals, 
      deleteDialog: { isOpen: false, item: null, onConfirm: null } 
    }
  })),
  
  // Selectors
  getLoadingState: (key) => get().loadingStates[key],
  getFormState: (formType) => get().forms[formType],
  getFilter: (key) => get().filters[key],
  getNotification: (type) => get().notifications[type],
  getModalState: (modalType) => get().modals[modalType],
  
  // Utility actions
  reset: () => set({
    isLoading: false,
    loadingStates: {
      silos: false,
      inbound: false,
      outbound: false,
      materials: false,
      operators: false,
      reports: false,
    },
    forms: {
      siloForm: { isOpen: false, editingItem: null },
      inboundForm: { isOpen: false, editingItem: null },
      outboundForm: { isOpen: false, editingItem: null },
    },
    filters: {
      dateRange: { startDate: '', endDate: '' },
      siloFilter: 'all',
      reportType: 'movements',
    },
    notifications: {
      success: null,
      error: null,
      warning: null,
      info: null,
    },
    modals: {
      confirmDialog: { isOpen: false, title: '', message: '', onConfirm: null },
      deleteDialog: { isOpen: false, item: null, onConfirm: null },
    },
  }),
}));

export { useUIStore };