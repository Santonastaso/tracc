import { 
  useSilosHooks, 
  useInboundHooks, 
  useOutboundHooks, 
  useMaterialsHooks, 
  useOperatorsHooks,
  useEnhancedSilosHooks,
  useEnhancedInboundHooks,
  useEnhancedOutboundHooks,
  enhancedSilosService,
  enhancedInboundService,
  enhancedOutboundService
} from '../services/ModernTraccService';
import { useTraccUIStore } from '../store/modernStores';

/**
 * Modern React Query hooks for tracc
 * These replace the old individual service calls with standardized patterns
 */

/**
 * Silos Hooks
 */
export const useSilos = (options = {}) => {
  const silosHooks = useSilosHooks;
  
  return silosHooks.useList(
    {
      orderBy: 'name',
      ascending: true,
      ...options
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch silos:', error);
      }
    }
  );
};

export const useSilosWithLevels = (siloIds = null) => {
  const enhancedSilosHooks = useEnhancedSilosHooks;
  
  return enhancedSilosHooks.useList(
    {},
    {
      queryKey: ['silos', 'withLevels', siloIds],
      queryFn: () => enhancedSilosService.getSilosWithLevels(siloIds),
      staleTime: 2 * 60 * 1000, // 2 minutes (levels change more frequently)
      onError: (error) => {
        console.error('Failed to fetch silos with levels:', error);
      }
    }
  );
};

export const useSilo = (id) => {
  const silosHooks = useSilosHooks;
  
  return silosHooks.useDetail(id, '*', {
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSiloUtilizationStats = () => {
  const enhancedSilosHooks = useEnhancedSilosHooks;
  
  return enhancedSilosHooks.useList(
    {},
    {
      queryKey: ['silos', 'utilizationStats'],
      queryFn: () => enhancedSilosService.getSiloUtilizationStats(),
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Failed to fetch silo utilization stats:', error);
      }
    }
  );
};

export const useCreateSilo = () => {
  const silosHooks = useSilosHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return silosHooks.useCreate({
    onSuccess: () => {
      showTraccAlert('Silo created successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to create silo: ${error.message}`, 'error');
    }
  });
};

export const useUpdateSilo = () => {
  const silosHooks = useSilosHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return silosHooks.useUpdate({
    onSuccess: () => {
      showTraccAlert('Silo updated successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to update silo: ${error.message}`, 'error');
    }
  });
};

export const useDeleteSilo = () => {
  const silosHooks = useSilosHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return silosHooks.useDelete({
    onSuccess: () => {
      showTraccAlert('Silo deleted successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to delete silo: ${error.message}`, 'error');
    }
  });
};

/**
 * Inbound Hooks
 */
export const useInbound = (options = {}) => {
  const inboundHooks = useInboundHooks;
  
  return inboundHooks.useList(
    {
      orderBy: 'created_at',
      ascending: false,
      ...options
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error('Failed to fetch inbound movements:', error);
      }
    }
  );
};

export const useInboundBySilo = (siloId) => {
  return useInbound({
    filters: siloId ? { silo_id: siloId } : undefined
  });
};

export const useInboundStats = (dateRange = null) => {
  const enhancedInboundHooks = useEnhancedInboundHooks;
  
  return enhancedInboundHooks.useList(
    {},
    {
      queryKey: ['inbound', 'stats', dateRange],
      queryFn: () => enhancedInboundService.getInboundStats(dateRange),
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Failed to fetch inbound stats:', error);
      }
    }
  );
};

export const useCreateInbound = () => {
  const enhancedInboundHooks = useEnhancedInboundHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return enhancedInboundHooks.useCreate({
    mutationFn: (data) => enhancedInboundService.createInboundWithValidation(data),
    onSuccess: () => {
      showTraccAlert('Inbound movement created successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to create inbound movement: ${error.message}`, 'error');
    }
  });
};

export const useUpdateInbound = () => {
  const inboundHooks = useInboundHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return inboundHooks.useUpdate({
    onSuccess: () => {
      showTraccAlert('Inbound movement updated successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to update inbound movement: ${error.message}`, 'error');
    }
  });
};

export const useDeleteInbound = () => {
  const inboundHooks = useInboundHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return inboundHooks.useDelete({
    onSuccess: () => {
      showTraccAlert('Inbound movement deleted successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to delete inbound movement: ${error.message}`, 'error');
    }
  });
};

/**
 * Outbound Hooks
 */
export const useOutbound = (options = {}) => {
  const outboundHooks = useOutboundHooks;
  
  return outboundHooks.useList(
    {
      orderBy: 'created_at',
      ascending: false,
      ...options
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error('Failed to fetch outbound movements:', error);
      }
    }
  );
};

export const useOutboundBySilo = (siloId) => {
  return useOutbound({
    filters: siloId ? { silo_id: siloId } : undefined
  });
};

export const useOutboundStats = (dateRange = null) => {
  const enhancedOutboundHooks = useEnhancedOutboundHooks;
  
  return enhancedOutboundHooks.useList(
    {},
    {
      queryKey: ['outbound', 'stats', dateRange],
      queryFn: () => enhancedOutboundService.getOutboundStats(dateRange),
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Failed to fetch outbound stats:', error);
      }
    }
  );
};

export const useCreateOutbound = () => {
  const enhancedOutboundHooks = useEnhancedOutboundHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return enhancedOutboundHooks.useCreate({
    mutationFn: (data) => enhancedOutboundService.createOutboundWithValidation(data),
    onSuccess: () => {
      showTraccAlert('Outbound movement created successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to create outbound movement: ${error.message}`, 'error');
    }
  });
};

export const useUpdateOutbound = () => {
  const outboundHooks = useOutboundHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return outboundHooks.useUpdate({
    onSuccess: () => {
      showTraccAlert('Outbound movement updated successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to update outbound movement: ${error.message}`, 'error');
    }
  });
};

export const useDeleteOutbound = () => {
  const outboundHooks = useOutboundHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return outboundHooks.useDelete({
    onSuccess: () => {
      showTraccAlert('Outbound movement deleted successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to delete outbound movement: ${error.message}`, 'error');
    }
  });
};

/**
 * Materials Hooks
 */
export const useMaterials = (options = {}) => {
  const materialsHooks = useMaterialsHooks;
  
  return materialsHooks.useList(
    {
      orderBy: 'name',
      ascending: true,
      ...options
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (materials change less frequently)
      onError: (error) => {
        console.error('Failed to fetch materials:', error);
      }
    }
  );
};

export const useMaterial = (id) => {
  const materialsHooks = useMaterialsHooks;
  
  return materialsHooks.useDetail(id, '*', {
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateMaterial = () => {
  const materialsHooks = useMaterialsHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return materialsHooks.useCreate({
    onSuccess: () => {
      showTraccAlert('Material created successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to create material: ${error.message}`, 'error');
    }
  });
};

export const useUpdateMaterial = () => {
  const materialsHooks = useMaterialsHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return materialsHooks.useUpdate({
    onSuccess: () => {
      showTraccAlert('Material updated successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to update material: ${error.message}`, 'error');
    }
  });
};

export const useDeleteMaterial = () => {
  const materialsHooks = useMaterialsHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return materialsHooks.useDelete({
    onSuccess: () => {
      showTraccAlert('Material deleted successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to delete material: ${error.message}`, 'error');
    }
  });
};

/**
 * Operators Hooks
 */
export const useOperators = (options = {}) => {
  const operatorsHooks = useOperatorsHooks;
  
  return operatorsHooks.useList(
    {
      orderBy: 'name',
      ascending: true,
      ...options
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (operators change less frequently)
      onError: (error) => {
        console.error('Failed to fetch operators:', error);
      }
    }
  );
};

export const useOperator = (id) => {
  const operatorsHooks = useOperatorsHooks;
  
  return operatorsHooks.useDetail(id, '*', {
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateOperator = () => {
  const operatorsHooks = useOperatorsHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return operatorsHooks.useCreate({
    onSuccess: () => {
      showTraccAlert('Operator created successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to create operator: ${error.message}`, 'error');
    }
  });
};

export const useUpdateOperator = () => {
  const operatorsHooks = useOperatorsHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return operatorsHooks.useUpdate({
    onSuccess: () => {
      showTraccAlert('Operator updated successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to update operator: ${error.message}`, 'error');
    }
  });
};

export const useDeleteOperator = () => {
  const operatorsHooks = useOperatorsHooks;
  const { showTraccAlert } = useTraccUIStore();
  
  return operatorsHooks.useDelete({
    onSuccess: () => {
      showTraccAlert('Operator deleted successfully', 'success');
    },
    onError: (error) => {
      showTraccAlert(`Failed to delete operator: ${error.message}`, 'error');
    }
  });
};

/**
 * Combined Statistics Hooks
 */
export const useTraccStats = () => {
  const siloStats = useSiloUtilizationStats();
  const inboundStats = useInboundStats();
  const outboundStats = useOutboundStats();
  
  return {
    silos: siloStats.data,
    inbound: inboundStats.data,
    outbound: outboundStats.data,
    isLoading: siloStats.isLoading || inboundStats.isLoading || outboundStats.isLoading,
    error: siloStats.error || inboundStats.error || outboundStats.error
  };
};

/**
 * Legacy compatibility hooks
 * These provide backward compatibility during migration
 */
export const useLegacyQueries = () => {
  const silos = useSilos();
  const inbound = useInbound();
  const outbound = useOutbound();
  const materials = useMaterials();
  const operators = useOperators();
  
  return {
    // Legacy format for backward compatibility
    silos: {
      data: silos.data || [],
      isLoading: silos.isLoading,
      error: silos.error,
      refetch: silos.refetch
    },
    
    inbound: {
      data: inbound.data || [],
      isLoading: inbound.isLoading,
      error: inbound.error,
      refetch: inbound.refetch
    },
    
    outbound: {
      data: outbound.data || [],
      isLoading: outbound.isLoading,
      error: outbound.error,
      refetch: outbound.refetch
    },
    
    materials: {
      data: materials.data || [],
      isLoading: materials.isLoading,
      error: materials.error,
      refetch: materials.refetch
    },
    
    operators: {
      data: operators.data || [],
      isLoading: operators.isLoading,
      error: operators.error,
      refetch: operators.refetch
    }
  };
};
