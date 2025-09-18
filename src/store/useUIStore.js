import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  // Loading states
  isLoading: false,
  
  // Set loading state
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Reset store
  reset: () => set({
    isLoading: false
  })
}));

export { useUIStore };