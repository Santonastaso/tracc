import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showSuccess, showError } from '../lib/toast';

export const outboundKeys = {
  all: ['outbound'],
  detail: (id) => ['outbound', id, 'detail'],
  withSilos: ['outbound', 'with-silos'],
  byBatch: (batchId) => ['outbound', 'batch', batchId],
};

const invalidateOutbound = (queryClient) => {
  queryClient.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'outbound',
  });
  queryClient.invalidateQueries({ queryKey: ['silos', 'withLevels'] });
};

// Outbound rows store the batch id inside the first element of the `items` JSON array,
// because the `outbound.batch_id` column does not exist in the current schema.
const matchesBatch = (record, batchId) =>
  Array.isArray(record?.items) && record.items[0]?.batch_id === batchId;

export const useOutbound = () =>
  useQuery({
    queryKey: outboundKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1 * 60 * 1000,
  });

export const useOutboundDetail = (id) =>
  useQuery({
    queryKey: outboundKeys.detail(id),
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
    queryKey: outboundKeys.withSilos,
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

export const useOutboundByBatch = (batchId) =>
  useQuery({
    queryKey: outboundKeys.byBatch(batchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select('*, silos!inner(name)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).filter((record) => matchesBatch(record, batchId));
    },
    enabled: !!batchId,
    staleTime: 1 * 60 * 1000,
  });

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
      invalidateOutbound(queryClient);
      queryClient.setQueryData(outboundKeys.all, (oldData) =>
        oldData ? [newOutbound, ...oldData] : [newOutbound]
      );
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
      queryClient.setQueryData(outboundKeys.all, (oldData) =>
        oldData?.map((item) => (item.id === id ? { ...item, ...updatedOutbound } : item))
      );
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
      queryClient.setQueryData(outboundKeys.all, (oldData) =>
        oldData?.filter((item) => item.id !== deletedOutbound.id)
      );
      showSuccess('Movimento OUT eliminato con successo');
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del movimento OUT: ${error.message}`);
    },
  });
};

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

export const useCreateOutboundBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ siloWithdrawals, operatorName, batchId }) => {
      const batchTimestamp = new Date().toISOString();
      const results = [];

      for (const withdrawal of siloWithdrawals) {
        const itemsWithBatch = withdrawal.items.map((item) => ({ ...item, batch_id: batchId }));
        const { data, error } = await supabase
          .from('outbound')
          .insert([
            {
              silo_id: withdrawal.silo_id,
              quantity_kg: withdrawal.quantity_kg,
              operator_name: operatorName,
              items: itemsWithBatch,
              created_at: batchTimestamp,
              updated_at: batchTimestamp,
            },
          ])
          .select()
          .single();
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
      const { data: allRecords, error: fetchError } = await supabase
        .from('outbound')
        .select('*');
      if (fetchError) throw fetchError;

      const batchRecords = (allRecords || []).filter((record) => matchesBatch(record, batchId));
      if (batchRecords.length === 0) {
        throw new Error('Batch non trovato');
      }

      const recordIds = batchRecords.map((r) => r.id);
      const { error } = await supabase.from('outbound').delete().in('id', recordIds);
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
