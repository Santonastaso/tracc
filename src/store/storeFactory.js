import { create } from 'zustand';

/**
 * Generic Store Factory for Tracc Project
 * Creates standardized Zustand stores with common patterns
 * Eliminates duplication across entity stores
 */

/**
 * Create common selectors for any entity type
 * @param {string} entityKey - Key used in state (e.g., 'silos', 'inbound', 'outbound')
 * @param {Function} get - Zustand get function
 * @returns {Object} Common selectors
 */
const createSelectors = (entityKey, get) => ({
  [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: () => get()[entityKey],
  
  [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ById`]: (id) => 
    get()[entityKey].find(entity => entity.id === id),
  
  [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}BySilo`]: (siloId) => 
    get()[entityKey].filter(entity => entity.silo_id === siloId),
  
  [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ByDate`]: (date) => {
    const targetDate = new Date(date).toISOString().split('T')[0];
    return get()[entityKey].filter(entity => {
      const entityDate = new Date(entity.created_at).toISOString().split('T')[0];
      return entityDate === targetDate;
    });
  },
  
  [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ByDateRange`]: (startDate, endDate) => {
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();
    return get()[entityKey].filter(entity => {
      const entityDate = new Date(entity.created_at).toISOString();
      return entityDate >= start && entityDate <= end;
    });
  },
});

/**
 * Create utility actions for any entity type
 * @param {string} entityKey - Key used in state
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @returns {Object} Utility actions
 */
const createUtilityActions = (entityKey, set, get) => ({
  [`set${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (entities) => 
    set({ [entityKey]: entities || [] }),

  [`add${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (entity) => {
    const state = get();
    set({ [entityKey]: [entity, ...state[entityKey]] });
  },

  [`update${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (id, updates) => {
    const state = get();
    const updatedEntities = state[entityKey].map(entity => 
      entity.id === id ? { ...entity, ...updates } : entity
    );
    set({ [entityKey]: updatedEntities });
  },

  [`remove${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (id) => {
    const state = get();
    const filteredEntities = state[entityKey].filter(entity => entity.id !== id);
    set({ [entityKey]: filteredEntities });
  },

  [`cleanupDuplicate${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: () => {
    const state = get();
    
    // Remove duplicate entities (keep first occurrence)
    const uniqueEntities = [];
    const seenIds = new Set();
    state[entityKey].forEach(entity => {
      if (!seenIds.has(entity.id)) {
        seenIds.add(entity.id);
        uniqueEntities.push(entity);
      }
    });
    
    set({ [entityKey]: uniqueEntities });
  },

  [`sort${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ByDate`]: (ascending = false) => {
    const state = get();
    const sortedEntities = [...state[entityKey]].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return ascending ? dateA - dateB : dateB - dateA;
    });
    set({ [entityKey]: sortedEntities });
  },

  reset: () => set({ [entityKey]: [] }),
});

/**
 * Create a standardized store for any entity type
 * @param {string} entityName - Name of the entity (e.g., 'Silo', 'Inbound', 'Outbound')
 * @param {string} entityKey - Key used in state (e.g., 'silos', 'inbound', 'outbound')
 * @param {Object} customActions - Custom actions specific to this entity
 * @param {Object} customSelectors - Custom selectors specific to this entity
 * @returns {Function} Zustand store creator
 */
export const createEntityStore = (entityName, entityKey, customActions = {}, customSelectors = {}) => {
  return create((set, get) => ({
    // State
    [entityKey]: [],

    // Common selectors
    ...createSelectors(entityKey, get),

    // Custom selectors
    ...customSelectors,

    // Common utility actions
    ...createUtilityActions(entityKey, set, get),

    // Custom actions specific to this entity
    ...customActions,
  }));
};

/**
 * Create a specialized store for silos with level calculations
 * @returns {Function} Zustand store creator
 */
export const createSiloStore = () => {
  return create((set, get) => ({
    // State
    silos: [],
    silosWithLevels: [],

    // Selectors
    getSilos: () => get().silos,
    getSilosWithLevels: () => get().silosWithLevels,
    getSiloById: (id) => get().silos.find(silo => silo.id === id),
    getSiloWithLevelsById: (id) => get().silosWithLevels.find(silo => silo.id === id),
    getSilosByCapacity: (minCapacity) => 
      get().silos.filter(silo => silo.capacity_kg >= minCapacity),
    getSilosByUtilization: (minUtilization) => 
      get().silosWithLevels.filter(silo => silo.utilizationPercentage >= minUtilization),

    // Actions
    setSilos: (silos) => set({ silos: silos || [] }),
    setSilosWithLevels: (silosWithLevels) => set({ silosWithLevels: silosWithLevels || [] }),
    
    addSilo: (silo) => {
      const state = get();
      set({ silos: [silo, ...state.silos] });
    },

    updateSilo: (id, updates) => {
      const state = get();
      const updatedSilos = state.silos.map(silo => 
        silo.id === id ? { ...silo, ...updates } : silo
      );
      set({ silos: updatedSilos });
    },

    removeSilo: (id) => {
      const state = get();
      const filteredSilos = state.silos.filter(silo => silo.id !== id);
      set({ silos: filteredSilos });
    },

    // Custom silo actions
    calculateTotalCapacity: () => {
      const state = get();
      return state.silos.reduce((total, silo) => total + (silo.capacity_kg || 0), 0);
    },

    calculateTotalCurrentStock: () => {
      const state = get();
      return state.silosWithLevels.reduce((total, silo) => total + (silo.currentLevel || 0), 0);
    },

    getSilosByMaterial: (materialId) => {
      const state = get();
      return state.silos.filter(silo => 
        silo.allowed_material_ids && silo.allowed_material_ids.includes(materialId)
      );
    },

    reset: () => set({ silos: [], silosWithLevels: [] }),
  }));
};

/**
 * Create a specialized store for movements (inbound/outbound) with FIFO logic
 * @param {string} entityKey - Key used in state ('inbound' or 'outbound')
 * @returns {Function} Zustand store creator
 */
export const createMovementStore = (entityKey) => {
  return create((set, get) => ({
    // State
    [entityKey]: [],

    // Selectors
    [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: () => get()[entityKey],
    [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ById`]: (id) => 
      get()[entityKey].find(movement => movement.id === id),
    [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}BySilo`]: (siloId) => 
      get()[entityKey].filter(movement => movement.silo_id === siloId),
    [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ByDate`]: (date) => {
      const targetDate = new Date(date).toISOString().split('T')[0];
      return get()[entityKey].filter(movement => {
        const movementDate = new Date(movement.created_at).toISOString().split('T')[0];
        return movementDate === targetDate;
      });
    },
    [`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ByDateRange`]: (startDate, endDate) => {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();
      return get()[entityKey].filter(movement => {
        const movementDate = new Date(movement.created_at).toISOString();
        return movementDate >= start && movementDate <= end;
      });
    },

    // Actions
    [`set${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (movements) => 
      set({ [entityKey]: movements || [] }),
    
    [`add${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (movement) => {
      const state = get();
      set({ [entityKey]: [movement, ...state[entityKey]] });
    },

    [`update${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (id, updates) => {
      const state = get();
      const updatedMovements = state[entityKey].map(movement => 
        movement.id === id ? { ...movement, ...updates } : movement
      );
      set({ [entityKey]: updatedMovements });
    },

    [`remove${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: (id) => {
      const state = get();
      const filteredMovements = state[entityKey].filter(movement => movement.id !== id);
      set({ [entityKey]: filteredMovements });
    },

    // Custom movement actions
    [`getTotal${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}Quantity`]: () => {
      const state = get();
      return state[entityKey].reduce((total, movement) => total + (movement.quantity_kg || 0), 0);
    },

    [`getTotal${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}QuantityBySilo`]: (siloId) => {
      const state = get();
      return state[entityKey]
        .filter(movement => movement.silo_id === siloId)
        .reduce((total, movement) => total + (movement.quantity_kg || 0), 0);
    },

    [`getTotal${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}QuantityByDateRange`]: (startDate, endDate) => {
      const movements = get()[`get${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ByDateRange`](startDate, endDate);
      return movements.reduce((total, movement) => total + (movement.quantity_kg || 0), 0);
    },

    [`sort${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}ByDate`]: (ascending = false) => {
      const state = get();
      const sortedMovements = [...state[entityKey]].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return ascending ? dateA - dateB : dateB - dateA;
      });
      set({ [entityKey]: sortedMovements });
    },

    reset: () => set({ [entityKey]: [] }),
  }));
};

/**
 * Pre-configured store creators for common entity types
 */
export const createSilosStore = () => createSiloStore();
export const createInboundStore = () => createMovementStore('inbound');
export const createOutboundStore = () => createMovementStore('outbound');
export const createMaterialsStore = () => createEntityStore('Material', 'materials');
export const createOperatorsStore = () => createEntityStore('Operator', 'operators');

