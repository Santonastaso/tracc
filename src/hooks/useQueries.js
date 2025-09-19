import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { silosService } from '../services';
import { showSuccess, showError } from '../utils/toast';

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
      return data;
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
      return data;
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
      return data;
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
      return data;
    },
    onSuccess: (newInbound) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inbound });
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
      return data;
    },
    onSuccess: (updatedInbound, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inbound });
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
