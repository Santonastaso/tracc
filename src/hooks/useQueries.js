import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { silosService } from '../services';
import { showSuccess, showError } from '@santonastaso/shared-utils';

// Query Keys - Centralized key management
export const queryKeys = {
  // Silos
  silos: ['silos'],
  silo: (id) => ['silos', id],
  silosWithLevels: ['silos', 'withLevels'],
  
  // Inbound
  inbound: ['inbound'],
  inboundBySilo: (siloId) => ['inbound', 'silo', siloId],
  inboundByDate: (date) => ['inbound', 'date', date],
  
  // Outbound
  outbound: ['outbound'],
  outboundBySilo: (siloId) => ['outbound', 'silo', siloId],
  outboundByDate: (date) => ['outbound', 'date', date],
  
  // Materials
  materials: ['materials'],
  material: (id) => ['materials', id],
  
  // Operators
  operators: ['operators'],
  operator: (id) => ['operators', id],
};

// ===== SILOS =====

export const useSilos = () => {
  return useQuery({
    queryKey: queryKeys.silos,
    queryFn: () => silosService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - silos don't change often
  });
};

export const useSilo = (id) => {
  return useQuery({
    queryKey: queryKeys.silo(id),
    queryFn: () => silosService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSilosWithLevels = (includeMaterials = false) => {
  return useQuery({
    queryKey: [...queryKeys.silosWithLevels, includeMaterials],
    queryFn: () => silosService.getSilosWithLevels(includeMaterials),
    staleTime: 2 * 60 * 1000, // 2 minutes - levels change more frequently
  });
};

export const useCreateSilo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (siloData) => silosService.createSilo(siloData),
    onSuccess: (newSilo) => {
      // Invalidate and refetch silos queries
      queryClient.invalidateQueries({ queryKey: queryKeys.silos });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.silos, (oldData) => {
        return oldData ? [...oldData, newSilo] : [newSilo];
      });
      
      showSuccess(`Silo "${newSilo?.name || 'Unknown'}" creato con successo`);
    },
    onError: (error) => {
      showError(`Errore nella creazione del silo: ${error.message}`);
    },
  });
};

export const useUpdateSilo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => silosService.updateSilo(id, updates),
    onSuccess: (updatedSilo, { id }) => {
      // Invalidate and refetch silos queries
      queryClient.invalidateQueries({ queryKey: queryKeys.silos });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.silos, (oldData) => {
        return oldData?.map(silo => 
          silo.id === id ? { ...silo, ...updatedSilo } : silo
        );
      });
      
      queryClient.setQueryData(queryKeys.silo(id), updatedSilo);
      
      showSuccess(`Silo "${updatedSilo?.name || 'Unknown'}" aggiornato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'aggiornamento del silo: ${error.message}`);
    },
  });
};

export const useDeleteSilo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const silo = await silosService.getById(id);
      await silosService.deleteSilo(id);
      return silo;
    },
    onSuccess: (deletedSilo) => {
      // Invalidate and refetch silos queries
      queryClient.invalidateQueries({ queryKey: queryKeys.silos });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Remove from cache optimistically
      queryClient.setQueryData(queryKeys.silos, (oldData) => {
        return oldData?.filter(silo => silo.id !== deletedSilo.id);
      });
      
      queryClient.removeQueries({ queryKey: queryKeys.silo(deletedSilo.id) });
      
      showSuccess(`Silo "${deletedSilo?.name || 'Unknown'}" eliminato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del silo: ${error.message}`);
    },
  });
};

// ===== INBOUND =====

export const useInbound = () => {
  return useQuery({
    queryKey: queryKeys.inbound,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Map lot_supplier to fornitore for UI compatibility
      return data?.map(item => ({
        ...item,
        fornitore: item.lot_supplier
      })) || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute - inbound data changes frequently
  });
};

export const useInboundBySilo = (siloId) => {
  return useQuery({
    queryKey: queryKeys.inboundBySilo(siloId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*')
        .eq('silo_id', siloId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Map lot_supplier to fornitore for UI compatibility
      return data?.map(item => ({
        ...item,
        fornitore: item.lot_supplier
      })) || [];
    },
    enabled: !!siloId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useInboundByDate = (date) => {
  return useQuery({
    queryKey: queryKeys.inboundByDate(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*')
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Map lot_supplier to fornitore for UI compatibility
      return data?.map(item => ({
        ...item,
        fornitore: item.lot_supplier
      })) || [];
    },
    enabled: !!date,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateInbound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inboundData) => {
      const { data, error } = await supabase
        .from('inbound')
        .insert([inboundData])
        .select()
        .single();
      
      if (error) throw error;
      // Map lot_supplier to fornitore for UI compatibility
      return {
        ...data,
        fornitore: data.lot_supplier
      };
    },
    onSuccess: (newInbound) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inbound });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.inbound, 'with-silos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.inboundBySilo(newInbound.silo_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.inbound, (oldData) => {
        return oldData ? [newInbound, ...oldData] : [newInbound];
      });
      
      showSuccess('Movimento IN registrato con successo');
    },
    onError: (error) => {
      showError(`Errore nella registrazione del movimento IN: ${error.message}`);
    },
  });
};

export const useUpdateInbound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('inbound')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      // Map lot_supplier to fornitore for UI compatibility
      return {
        ...data,
        fornitore: data.lot_supplier
      };
    },
    onSuccess: (updatedInbound, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inbound });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.inbound, 'with-silos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.inboundBySilo(updatedInbound.silo_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.inbound, (oldData) => {
        return oldData?.map(item => 
          item.id === id ? { ...item, ...updatedInbound } : item
        );
      });
      
      showSuccess('Movimento IN aggiornato con successo');
    },
    onError: (error) => {
      showError(`Errore nell'aggiornamento del movimento IN: ${error.message}`);
    },
  });
};

export const useDeleteInbound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data: inbound, error: fetchError } = await supabase
        .from('inbound')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('inbound')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return inbound;
    },
    onSuccess: (deletedInbound) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inbound });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.inbound, 'with-silos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.inboundBySilo(deletedInbound.silo_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Remove from cache optimistically
      queryClient.setQueryData(queryKeys.inbound, (oldData) => {
        return oldData?.filter(item => item.id !== deletedInbound.id);
      });
      
      showSuccess('Movimento IN eliminato con successo');
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del movimento IN: ${error.message}`);
    },
  });
};

// ===== OUTBOUND =====

export const useOutbound = () => {
  return useQuery({
    queryKey: queryKeys.outbound,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - outbound data changes frequently
  });
};

export const useOutboundBySilo = (siloId) => {
  return useQuery({
    queryKey: queryKeys.outboundBySilo(siloId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select('*')
        .eq('silo_id', siloId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!siloId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useOutboundByDate = (date) => {
  return useQuery({
    queryKey: queryKeys.outboundByDate(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select('*')
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!date,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateOutbound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (outboundData) => {
      const { data, error } = await supabase
        .from('outbound')
        .insert([outboundData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newOutbound) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.outbound });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.outbound, 'with-silos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.outboundBySilo(newOutbound.silo_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.outbound, (oldData) => {
        return oldData ? [newOutbound, ...oldData] : [newOutbound];
      });
      
      showSuccess('Movimento OUT registrato con successo');
    },
    onError: (error) => {
      showError(`Errore nella registrazione del movimento OUT: ${error.message}`);
    },
  });
};

export const useUpdateOutbound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('outbound')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedOutbound, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.outbound });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.outbound, 'with-silos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.outboundBySilo(updatedOutbound.silo_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.outbound, (oldData) => {
        return oldData?.map(item => 
          item.id === id ? { ...item, ...updatedOutbound } : item
        );
      });
      
      showSuccess('Movimento OUT aggiornato con successo');
    },
    onError: (error) => {
      showError(`Errore nell'aggiornamento del movimento OUT: ${error.message}`);
    },
  });
};

export const useDeleteOutbound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data: outbound, error: fetchError } = await supabase
        .from('outbound')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('outbound')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return outbound;
    },
    onSuccess: (deletedOutbound) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.outbound });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.outbound, 'with-silos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.outboundBySilo(deletedOutbound.silo_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      // Remove from cache optimistically
      queryClient.setQueryData(queryKeys.outbound, (oldData) => {
        return oldData?.filter(item => item.id !== deletedOutbound.id);
      });
      
      showSuccess('Movimento OUT eliminato con successo');
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del movimento OUT: ${error.message}`);
    },
  });
};

// ===== MATERIALS =====

export const useMaterials = () => {
  return useQuery({
    queryKey: queryKeys.materials,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - materials don't change often
  });
};

export const useMaterial = (id) => {
  return useQuery({
    queryKey: queryKeys.material(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

// ===== OPERATORS =====

export const useOperators = () => {
  return useQuery({
    queryKey: queryKeys.operators,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - operators don't change often
  });
};

export const useOperator = (id) => {
  return useQuery({
    queryKey: queryKeys.operator(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

// ===== MATERIALS MUTATIONS =====

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (materialData) => {
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newMaterial) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.materials });
      
      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.materials, (oldData) => {
        return oldData ? [newMaterial, ...oldData] : [newMaterial];
      });
      
      showSuccess(`Materiale "${newMaterial?.name || 'Unknown'}" creato con successo`);
    },
    onError: (error) => {
      showError(`Errore nella creazione del materiale: ${error.message}`);
    },
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedMaterial, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.materials });
      
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.materials, (oldData) => {
        return oldData?.map(material => 
          material.id === id ? { ...material, ...updatedMaterial } : material
        );
      });
      
      queryClient.setQueryData(queryKeys.material(id), updatedMaterial);
      
      showSuccess(`Materiale "${updatedMaterial?.name || 'Unknown'}" aggiornato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'aggiornamento del materiale: ${error.message}`);
    },
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data: material, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return material;
    },
    onSuccess: (deletedMaterial) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.materials });
      
      // Remove from cache optimistically
      queryClient.setQueryData(queryKeys.materials, (oldData) => {
        return oldData?.filter(material => material.id !== deletedMaterial.id);
      });
      
      queryClient.removeQueries({ queryKey: queryKeys.material(deletedMaterial.id) });
      
      showSuccess(`Materiale "${deletedMaterial?.name || 'Unknown'}" eliminato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del materiale: ${error.message}`);
    },
  });
};

// ===== OPERATORS MUTATIONS =====

export const useCreateOperator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (operatorData) => {
      const { data, error } = await supabase
        .from('operators')
        .insert([operatorData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newOperator) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.operators });
      
      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.operators, (oldData) => {
        return oldData ? [newOperator, ...oldData] : [newOperator];
      });
      
      showSuccess(`Operatore "${newOperator?.name || 'Unknown'}" creato con successo`);
    },
    onError: (error) => {
      showError(`Errore nella creazione dell'operatore: ${error.message}`);
    },
  });
};

export const useUpdateOperator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('operators')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedOperator, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.operators });
      
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.operators, (oldData) => {
        return oldData?.map(operator => 
          operator.id === id ? { ...operator, ...updatedOperator } : operator
        );
      });
      
      queryClient.setQueryData(queryKeys.operator(id), updatedOperator);
      
      showSuccess(`Operatore "${updatedOperator?.name || 'Unknown'}" aggiornato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'aggiornamento dell'operatore: ${error.message}`);
    },
  });
};

export const useDeleteOperator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data: operator, error: fetchError } = await supabase
        .from('operators')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('operators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return operator;
    },
    onSuccess: (deletedOperator) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.operators });
      
      // Remove from cache optimistically
      queryClient.setQueryData(queryKeys.operators, (oldData) => {
        return oldData?.filter(operator => operator.id !== deletedOperator.id);
      });
      
      queryClient.removeQueries({ queryKey: queryKeys.operator(deletedOperator.id) });
      
      showSuccess(`Operatore "${deletedOperator?.name || 'Unknown'}" eliminato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione dell'operatore: ${error.message}`);
    },
  });
};

// ===== SUPPLIERS MUTATIONS =====

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplierData) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newSupplier) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      // Add to cache optimistically
      queryClient.setQueryData(['suppliers'], (oldData) => {
        return oldData ? [newSupplier, ...oldData] : [newSupplier];
      });
      
      showSuccess(`Fornitore "${newSupplier?.name || 'Unknown'}" creato con successo`);
    },
    onError: (error) => {
      showError(`Errore nella creazione del fornitore: ${error.message}`);
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedSupplier, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      // Update cache optimistically
      queryClient.setQueryData(['suppliers'], (oldData) => {
        return oldData?.map(supplier => 
          supplier.id === id ? { ...supplier, ...updatedSupplier } : supplier
        );
      });
      
      showSuccess(`Fornitore "${updatedSupplier?.name || 'Unknown'}" aggiornato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'aggiornamento del fornitore: ${error.message}`);
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data: supplier, error: fetchError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return supplier;
    },
    onSuccess: (deletedSupplier) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      // Remove from cache optimistically
      queryClient.setQueryData(['suppliers'], (oldData) => {
        return oldData?.filter(supplier => supplier.id !== deletedSupplier.id);
      });
      
      showSuccess(`Fornitore "${deletedSupplier?.name || 'Unknown'}" eliminato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del fornitore: ${error.message}`);
    },
  });
};
