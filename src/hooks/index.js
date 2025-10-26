// Export all query hooks for centralized access
export {
  // Query keys
  queryKeys,
  
  // Silos
  useSilos,
  useSilo,
  useSilosWithLevels,
  useCreateSilo,
  useUpdateSilo,
  useDeleteSilo,
  
  // Inbound
  useInbound,
  useInboundBySilo,
  useInboundByDate,
  useCreateInbound,
  useUpdateInbound,
  useDeleteInbound,
  
  // Outbound
  useOutbound,
  useOutboundBySilo,
  useOutboundByDate,
  useCreateOutbound,
  useUpdateOutbound,
  useDeleteOutbound,
  
  // Materials
  useMaterials,
  useMaterial,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  
  // Operators
  useOperators,
  useOperator,
  useCreateOperator,
  useUpdateOperator,
  useDeleteOperator,
  
  // Suppliers
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from './useQueries';

// Export utility hooks from shared package
export { 
  useErrorHandler, 
  useValidationErrorHandler
} from '@santonastaso/shared';

// Export local utility hooks
export { useValidation } from './useValidation';
export { useStoreSync } from './useStoreSync';
