import { createEntityStore, createUIStore } from '@santonastaso/shared';

/**
 * Modern store implementations for tracc using shared store factory
 * These replace all individual store files with standardized patterns
 */

/**
 * Silos Store
 * Replaces useSilosStore.js with factory-generated store
 */
export const useSilosStore = createEntityStore(
  'silos',
  // Custom actions specific to silos
  (set, get) => ({
    // Silo-specific selectors
    getSiloById: (id) => {
      const state = get();
      return state.entities.find(silo => silo.id === id);
    },

    getSilosByCapacityRange: (minCapacity, maxCapacity) => {
      const state = get();
      return state.entities.filter(silo => 
        silo.capacity_kg >= minCapacity && silo.capacity_kg <= maxCapacity
      );
    },

    getAvailableSilos: () => {
      const state = get();
      return state.entities.filter(silo => silo.currentLevel < silo.capacity_kg);
    },

    // Silo-specific actions
    updateSiloLevel: (id, currentLevel, availableItems = []) => {
      const state = get();
      const updatedSilos = state.entities.map(silo => 
        silo.id === id 
          ? { 
              ...silo, 
              currentLevel,
              availableItems,
              utilizationPercentage: silo.capacity_kg > 0 
                ? Math.min(100, (currentLevel / silo.capacity_kg) * 100)
                : 0,
              updated_at: new Date().toISOString()
            }
          : silo
      );
      set({ entities: updatedSilos });
    },

    // Statistics
    getSiloStats: () => {
      const state = get();
      const stats = {
        total: state.entities.length,
        empty: 0,
        low: 0,
        medium: 0,
        high: 0,
        full: 0,
        totalCapacity: 0,
        totalUsed: 0
      };

      state.entities.forEach(silo => {
        stats.totalCapacity += silo.capacity_kg || 0;
        stats.totalUsed += silo.currentLevel || 0;
        
        const utilization = silo.utilizationPercentage || 0;
        
        if (utilization === 0) stats.empty++;
        else if (utilization <= 25) stats.low++;
        else if (utilization <= 50) stats.medium++;
        else if (utilization <= 75) stats.high++;
        else stats.full++;
      });

      stats.overallUtilization = stats.totalCapacity > 0 
        ? (stats.totalUsed / stats.totalCapacity) * 100 
        : 0;

      return stats;
    },
  }),
  // Custom selectors
  (get) => ({
    // Additional computed values can be added here
  }),
  // Persistence options
  {
    partialize: (state) => ({
      entities: state.entities,
      initialized: state.initialized
    })
  }
);

/**
 * Inbound Store
 * Replaces useInboundStore.js with factory-generated store
 */
export const useInboundStore = createEntityStore(
  'inbound',
  // Custom actions specific to inbound movements
  (set, get) => ({
    // Inbound-specific selectors
    getInboundBySilo: (siloId) => {
      const state = get();
      return state.entities.filter(inbound => inbound.silo_id === siloId);
    },

    getInboundByProduct: (product) => {
      const state = get();
      return state.entities.filter(inbound => inbound.product === product);
    },

    getInboundBySupplier: (supplier) => {
      const state = get();
      return state.entities.filter(inbound => inbound.supplier === supplier);
    },

    getInboundByDateRange: (startDate, endDate) => {
      const state = get();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return state.entities.filter(inbound => {
        const inboundDate = new Date(inbound.created_at);
        return inboundDate >= start && inboundDate <= end;
      });
    },

    // Statistics
    getInboundStats: () => {
      const state = get();
      const stats = {
        total: state.entities.length,
        totalQuantity: 0,
        byProduct: {},
        bySupplier: {},
        byMonth: {}
      };

      state.entities.forEach(inbound => {
        stats.totalQuantity += inbound.quantity_kg || 0;
        
        // By product
        const product = inbound.product || 'Unknown';
        stats.byProduct[product] = (stats.byProduct[product] || 0) + (inbound.quantity_kg || 0);
        
        // By supplier
        const supplier = inbound.supplier || 'Unknown';
        stats.bySupplier[supplier] = (stats.bySupplier[supplier] || 0) + (inbound.quantity_kg || 0);
        
        // By month
        const month = new Date(inbound.created_at).toISOString().slice(0, 7);
        stats.byMonth[month] = (stats.byMonth[month] || 0) + (inbound.quantity_kg || 0);
      });

      return stats;
    },
  })
);

/**
 * Outbound Store
 * Replaces useOutboundStore.js with factory-generated store
 */
export const useOutboundStore = createEntityStore(
  'outbound',
  // Custom actions specific to outbound movements
  (set, get) => ({
    // Outbound-specific selectors
    getOutboundBySilo: (siloId) => {
      const state = get();
      return state.entities.filter(outbound => outbound.silo_id === siloId);
    },

    getOutboundByOperator: (operatorName) => {
      const state = get();
      return state.entities.filter(outbound => outbound.operator_name === operatorName);
    },

    getOutboundByDateRange: (startDate, endDate) => {
      const state = get();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return state.entities.filter(outbound => {
        const outboundDate = new Date(outbound.created_at);
        return outboundDate >= start && outboundDate <= end;
      });
    },

    // Statistics
    getOutboundStats: () => {
      const state = get();
      const stats = {
        total: state.entities.length,
        totalQuantity: 0,
        byOperator: {},
        byMonth: {}
      };

      state.entities.forEach(outbound => {
        stats.totalQuantity += outbound.quantity_kg || 0;
        
        // By operator
        const operator = outbound.operator_name || 'Unknown';
        stats.byOperator[operator] = (stats.byOperator[operator] || 0) + (outbound.quantity_kg || 0);
        
        // By month
        const month = new Date(outbound.created_at).toISOString().slice(0, 7);
        stats.byMonth[month] = (stats.byMonth[month] || 0) + (outbound.quantity_kg || 0);
      });

      return stats;
    },
  })
);

/**
 * Materials Store
 * Replaces useMaterialsStore.js with factory-generated store
 */
export const useMaterialsStore = createEntityStore(
  'materials',
  // Custom actions specific to materials
  (set, get) => ({
    // Material-specific selectors
    getMaterialByName: (name) => {
      const state = get();
      return state.entities.find(material => material.name === name);
    },

    searchMaterials: (searchTerm) => {
      const state = get();
      if (!searchTerm) return state.entities;
      
      const term = searchTerm.toLowerCase();
      return state.entities.filter(material => 
        material.name?.toLowerCase().includes(term) ||
        material.description?.toLowerCase().includes(term)
      );
    },

    // Statistics
    getMaterialStats: () => {
      const state = get();
      return {
        total: state.entities.length,
        active: state.entities.filter(m => m.active !== false).length,
        inactive: state.entities.filter(m => m.active === false).length
      };
    },
  })
);

/**
 * Operators Store
 * Replaces useOperatorsStore.js with factory-generated store
 */
export const useOperatorsStore = createEntityStore(
  'operators',
  // Custom actions specific to operators
  (set, get) => ({
    // Operator-specific selectors
    getOperatorByName: (name) => {
      const state = get();
      return state.entities.find(operator => operator.name === name);
    },

    getActiveOperators: () => {
      const state = get();
      return state.entities.filter(operator => operator.active !== false);
    },

    searchOperators: (searchTerm) => {
      const state = get();
      if (!searchTerm) return state.entities;
      
      const term = searchTerm.toLowerCase();
      return state.entities.filter(operator => 
        operator.name?.toLowerCase().includes(term) ||
        operator.email?.toLowerCase().includes(term)
      );
    },

    // Statistics
    getOperatorStats: () => {
      const state = get();
      return {
        total: state.entities.length,
        active: state.entities.filter(o => o.active !== false).length,
        inactive: state.entities.filter(o => o.active === false).length
      };
    },
  })
);

/**
 * Enhanced UI Store for Tracc
 * Replaces useUIStore.js with factory-generated store plus tracc-specific state
 */
export const useTraccUIStore = createUIStore(
  // Custom actions specific to tracc UI
  (set, get) => ({
    // Tracc-specific state
    selectedSilo: null,
    reportType: 'daily',
    dateRange: {
      startDate: null,
      endDate: null
    },
    
    // Tracc-specific actions
    setSelectedSilo: (siloId) => set({ selectedSilo: siloId }),
    
    setReportType: (reportType) => set({ reportType }),
    
    setDateRange: (startDate, endDate) => {
      set({ 
        dateRange: { 
          startDate, 
          endDate 
        } 
      });
    },

    // Enhanced notification system for tracc
    showTraccAlert: (message, type = 'info', duration = 5000) => {
      const state = get();
      const notification = {
        type,
        message,
        timestamp: Date.now()
      };
      
      state.addNotification(notification);
      
      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          state.removeNotification(notification.id);
        }, duration);
      }
    },

    // Confirmation dialogs
    showDeleteDialog: (title, message, onConfirm) => {
      const state = get();
      state.setFormData('deleteDialog', {
        isOpen: true,
        title,
        message,
        onConfirm
      });
      state.openModal('deleteDialog');
    },

    closeDeleteDialog: () => {
      const state = get();
      state.clearFormData('deleteDialog');
      state.closeModal('deleteDialog');
    },

    // Tracc-specific getters
    getSelectedSilo: () => {
      const state = get();
      return state.selectedSilo;
    },

    getDateRange: () => {
      const state = get();
      return state.dateRange;
    },
  }),
  // Persistence options
  {
    partialize: (state) => ({
      selectedSilo: state.selectedSilo,
      reportType: state.reportType,
      dateRange: state.dateRange,
      theme: state.theme,
      sidebarOpen: state.sidebarOpen,
      filters: state.filters
    })
  }
);

// Export individual stores for direct access
export {
  useSilosStore as useModernSilosStore,
  useInboundStore as useModernInboundStore,
  useOutboundStore as useModernOutboundStore,
  useMaterialsStore as useModernMaterialsStore,
  useOperatorsStore as useModernOperatorsStore,
  useTraccUIStore as useModernUIStore
};
