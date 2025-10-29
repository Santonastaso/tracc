// Export all stores
export { useUIStore } from './useUIStore';
export { useSilosStore } from './useSilosStore';
export { useInboundStore } from './useInboundStore';
export { useOutboundStore } from './useOutboundStore';
export { useMaterialsStore } from './useMaterialsStore';
export { useOperatorsStore } from './useOperatorsStore';

// Export store factory
export { 
  createEntityStore,
  createCRUDStore,
  createPaginatedStore,
  createUIStore
} from '@santonastaso/shared';