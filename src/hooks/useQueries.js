import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { silosService } from '../lib/silos-service';
import { showSuccess, showError } from '../lib/toast';
import { makeEntityHooks } from './entity-hooks';

// Query Keys - Centralized key management
export const queryKeys = {
  // Silos
  silos: ['silos'],
  silo: (id) => ['silos', id],
  silosList: ['silos', 'list'],
  silosWithLevels: ['silos', 'withLevels'],
  
  // Inbound
  inbound: ['inbound'],
  
  // Outbound
  outbound: ['outbound'],
  outboundByBatch: (batchId) => ['outbound', 'batch', batchId],
  
  // Materials
  materials: ['materials'],
  material: (id) => ['materials', id],
  
  // Operators
  operators: ['operators'],
  operator: (id) => ['operators', id],

  // Suppliers
  suppliers: ['suppliers'],
  supplier: (id) => ['suppliers', id],
};

const inboundWithSilosKey = ['inbound', 'with-silos'];
const outboundWithSilosKey = ['outbound', 'with-silos'];

const invalidateSilos = (queryClient) => {
  queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'silos' });
};

const invalidateInbound = (queryClient) => {
  queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'inbound' });
  queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
};

const invalidateOutbound = (queryClient) => {
  queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'outbound' });
  queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
};

// ===== SILOS =====

export const useSilos = () => {
  return useQuery({
    queryKey: queryKeys.silos,
    queryFn: () => silosService.getSilosWithLevels(),
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

export const useUpdateSilo = ({ silent = false } = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => silosService.updateSilo(id, updates),
    onSuccess: (updatedSilo, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.silos });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });
      
      queryClient.setQueryData(queryKeys.silos, (oldData) => {
        return oldData?.map(silo => 
          silo.id === id ? { ...silo, ...updatedSilo } : silo
        );
      });
      
      queryClient.setQueryData(queryKeys.silo(id), updatedSilo);
      
      if (!silent) {
        showSuccess(`Silo "${updatedSilo?.name || 'Unknown'}" aggiornato con successo`);
      }
    },
    onError: (error) => {
      showError(`Errore nell'aggiornamento del silo: ${error.message}`);
    },
  });
};

export const useDeleteSilo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => silosService.deleteSilo(id),
    onSuccess: (deletedSilo) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.silos });
      queryClient.invalidateQueries({ queryKey: queryKeys.silosWithLevels });

      if (!deletedSilo) return;

      queryClient.setQueryData(queryKeys.silos, (oldData) => {
        return oldData?.filter((silo) => silo.id !== deletedSilo.id);
      });

      queryClient.removeQueries({ queryKey: queryKeys.silo(deletedSilo.id) });

      showSuccess(`Silo "${deletedSilo?.name || 'Unknown'}" eliminato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del silo: ${error.message}`);
    },
  });
};

export const useSilosList = () =>
  useQuery({
    queryKey: queryKeys.silosList,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('silos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useBulkDeleteSilos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.from('silos').delete().in('id', ids);
      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      invalidateSilos(queryClient);
      showSuccess(`${ids.length} silos eliminati con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione: ${error.message}`);
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
      
      if (error) throw error;      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute - inbound data changes frequently
  });
};

export const useInboundDetail = (id) =>
  useQuery({
    queryKey: ['inbound', id, 'detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*, silos(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useInboundWithSilos = () =>
  useQuery({
    queryKey: inboundWithSilosKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000,
  });

export const useBulkDeleteInbound = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.from('inbound').delete().in('id', ids);
      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      invalidateInbound(queryClient);
      showSuccess(`${ids.length} movimenti IN eliminati con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione: ${error.message}`);
    },
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
      
      if (error) throw error;      return data;
    },
    onSuccess: (newInbound) => {
      // Invalidate related queries
      invalidateInbound(queryClient);
      
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

export const useUpdateInbound = ({ silent = false } = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('inbound')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;      return data;
    },
    onSuccess: (updatedInbound, { id }) => {
      invalidateInbound(queryClient);
      
      queryClient.setQueryData(queryKeys.inbound, (oldData) => {
        return oldData?.map(item => 
          item.id === id ? { ...item, ...updatedInbound } : item
        );
      });
      
      if (!silent) {
        showSuccess('Movimento IN aggiornato con successo');
      }
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

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return null;
        throw fetchError;
      }

      const { error } = await supabase.from('inbound').delete().eq('id', id);
      if (error) throw error;
      return inbound;
    },
    onSuccess: (deletedInbound) => {
      invalidateInbound(queryClient);
      if (!deletedInbound) return;

      queryClient.setQueryData(queryKeys.inbound, (oldData) => {
        return oldData?.filter((item) => item.id !== deletedInbound.id);
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

export const useOutboundDetail = (id) =>
  useQuery({
    queryKey: ['outbound', id, 'detail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select('*, silos!inner(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useOutboundWithSilos = () =>
  useQuery({
    queryKey: outboundWithSilosKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select('*, silos!inner(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000,
  });

export const useBulkDeleteOutbound = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.from('outbound').delete().in('id', ids);
      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      invalidateOutbound(queryClient);
      showSuccess(`${ids.length} movimenti OUT eliminati con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione: ${error.message}`);
    },
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
      invalidateOutbound(queryClient);
      
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

export const useUpdateOutbound = ({ silent = false } = {}) => {
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
      invalidateOutbound(queryClient);
      
      queryClient.setQueryData(queryKeys.outbound, (oldData) => {
        return oldData?.map(item => 
          item.id === id ? { ...item, ...updatedOutbound } : item
        );
      });
      
      if (!silent) {
        showSuccess('Movimento OUT aggiornato con successo');
      }
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

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return null;
        throw fetchError;
      }

      const { error } = await supabase.from('outbound').delete().eq('id', id);
      if (error) throw error;
      return outbound;
    },
    onSuccess: (deletedOutbound) => {
      invalidateOutbound(queryClient);
      if (!deletedOutbound) return;

      queryClient.setQueryData(queryKeys.outbound, (oldData) => {
        return oldData?.filter((item) => item.id !== deletedOutbound.id);
      });

      showSuccess('Movimento OUT eliminato con successo');
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del movimento OUT: ${error.message}`);
    },
  });
};

// ===== OUTBOUND BATCH (Multi-Silo Mixtures) =====

export const useOutboundByBatch = (batchId) => {
  return useQuery({
    queryKey: queryKeys.outboundByBatch(batchId),
    queryFn: async () => {
      // First try batch_id column
      let { data, error } = await supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });
      
      // If column doesn't exist or no data, search in items
      if (error || !data || data.length === 0) {
        const { data: allData, error: allError } = await supabase
          .from('outbound')
          .select(`
            *,
            silos!inner(name)
          `)
          .order('created_at', { ascending: true });
        
        if (allError) throw allError;
        
        // Filter by batch_id in items
        data = allData?.filter(record => {
          if (record.items && record.items.length > 0 && record.items[0].batch_id === batchId) {
            return true;
          }
          return false;
        }) || [];
      }
      
      return data;
    },
    enabled: !!batchId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateOutboundBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchData) => {
      const { siloWithdrawals, operatorName, batchId } = batchData;
      const results = [];
      const batchTimestamp = new Date().toISOString();
      
      for (const withdrawal of siloWithdrawals) {
        // Add batch_id to each item for grouping (workaround if column doesn't exist)
        const itemsWithBatch = withdrawal.items.map(item => ({
          ...item,
          batch_id: batchId
        }));
        
        const insertData = {
          silo_id: withdrawal.silo_id,
          quantity_kg: withdrawal.quantity_kg,
          operator_name: operatorName,
          items: itemsWithBatch,
          created_at: batchTimestamp,
          updated_at: batchTimestamp
        };
        
        // Try with batch_id column first, fall back to without
        let data, error;
        ({ data, error } = await supabase
          .from('outbound')
          .insert([{ ...insertData, batch_id: batchId }])
          .select()
          .single());
        
        // If batch_id column doesn't exist, try without it
        if (error && error.message.includes('batch_id')) {
          ({ data, error } = await supabase
            .from('outbound')
            .insert([insertData])
            .select()
            .single());
        }
        
        if (error) throw error;
        results.push({ ...data, batch_id: batchId });
      }
      
      return results;
    },
    onSuccess: (newOutbounds) => {
      invalidateOutbound(queryClient);
      
      const siloCount = newOutbounds.length;
      const totalQty = newOutbounds.reduce((sum, o) => sum + o.quantity_kg, 0);
      showSuccess(`Miscela registrata: ${siloCount} silos, ${totalQty.toFixed(2)} kg totali`);
    },
    onError: (error) => {
      showError(`Errore nella registrazione della miscela: ${error.message}`);
    },
  });
};

export const useDeleteOutboundBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchId) => {
      // First try to fetch by batch_id column
      let { data: batchRecords, error: fetchError } = await supabase
        .from('outbound')
        .select('*')
        .eq('batch_id', batchId);
      
      // If column doesn't exist or no records found, search in items
      if (fetchError || !batchRecords || batchRecords.length === 0) {
        // Fetch all records and filter by batch_id in items
        const { data: allRecords, error: allError } = await supabase
          .from('outbound')
          .select('*');
        
        if (allError) throw allError;
        
        batchRecords = allRecords?.filter(record => {
          if (record.items && record.items.length > 0 && record.items[0].batch_id === batchId) {
            return true;
          }
          return false;
        }) || [];
      }
      
      if (!batchRecords || batchRecords.length === 0) {
        throw new Error('Batch non trovato');
      }
      
      // Delete all records by their IDs
      const recordIds = batchRecords.map(r => r.id);
      const { error } = await supabase
        .from('outbound')
        .delete()
        .in('id', recordIds);
      
      if (error) throw error;
      return batchRecords;
    },
    onSuccess: (deletedRecords) => {
      invalidateOutbound(queryClient);
      
      showSuccess(`Miscela eliminata: ${deletedRecords.length} movimenti rimossi`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione della miscela: ${error.message}`);
    },
  });
};

// ===== MATERIALS / OPERATORS / SUPPLIERS (entity factory) =====

const materialsEntity = makeEntityHooks('materials', 'Materiale', { detailStaleTime: 10 * 60 * 1000 });
const operatorsEntity = makeEntityHooks('operators', 'Operatore', { detailStaleTime: 10 * 60 * 1000 });
const suppliersEntity = makeEntityHooks('suppliers', 'Fornitore');

export const useMaterials = () =>
  materialsEntity.useList({
    orderBy: 'name',
    ascending: true,
    queryKey: queryKeys.materials,
    staleTime: 10 * 60 * 1000,
  });

export const useMaterialsList = () =>
  materialsEntity.useList({
    orderBy: 'created_at',
    ascending: false,
    queryKey: ['materials', 'list'],
  });

export const useMaterial = (id) => materialsEntity.useDetail(id);

export const useOperators = () =>
  operatorsEntity.useList({
    orderBy: 'name',
    ascending: true,
    queryKey: queryKeys.operators,
    staleTime: 10 * 60 * 1000,
  });

export const useOperatorsList = () =>
  operatorsEntity.useList({
    orderBy: 'created_at',
    ascending: false,
    queryKey: ['operators', 'list'],
  });

export const useOperator = (id) => operatorsEntity.useDetail(id);

export const useCreateMaterial = (messages) => materialsEntity.useCreate(messages);
export const useUpdateMaterial = (messages) => materialsEntity.useUpdate(messages);
export const useDeleteMaterial = (messages) => materialsEntity.useDelete(messages);
export const useBulkDeleteMaterials = () => materialsEntity.useBulkDelete();

export const useCreateOperator = (messages) => operatorsEntity.useCreate(messages);
export const useUpdateOperator = (messages) => operatorsEntity.useUpdate(messages);
export const useDeleteOperator = (messages) => operatorsEntity.useDelete(messages);
export const useBulkDeleteOperators = () => operatorsEntity.useBulkDelete();

export const useSuppliers = () =>
  suppliersEntity.useList({
    orderBy: 'created_at',
    ascending: false,
    queryKey: queryKeys.suppliers,
    staleTime: 5 * 60 * 1000,
  });

export const useActiveSuppliers = () =>
  suppliersEntity.useList({
    orderBy: 'name',
    ascending: true,
    select: 'id, name',
    filters: { active: true },
    queryKey: ['suppliers', 'active'],
    staleTime: 5 * 60 * 1000,
  });

export const useSupplier = (id) => suppliersEntity.useDetail(id);

export const useCreateSupplier = (messages) => suppliersEntity.useCreate(messages);
export const useUpdateSupplier = (messages) => suppliersEntity.useUpdate(messages);
export const useDeleteSupplier = (messages) => suppliersEntity.useDelete(messages);
export const useBulkDeleteSuppliers = () => suppliersEntity.useBulkDelete();
