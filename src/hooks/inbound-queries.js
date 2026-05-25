import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showSuccess, showError } from '../lib/toast';

const inboundKeys = {
  all: ['inbound'],
  detail: (id) => ['inbound', id, 'detail'],
  withSilos: ['inbound', 'with-silos'],
};

const invalidateInbound = (queryClient) => {
  queryClient.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'inbound',
  });
  queryClient.invalidateQueries({ queryKey: ['silos', 'withLevels'] });
};

export const useInbound = () =>
  useQuery({
    queryKey: inboundKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000,
  });

export const useInboundDetail = (id) =>
  useQuery({
    queryKey: inboundKeys.detail(id),
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
    queryKey: inboundKeys.withSilos,
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
      invalidateInbound(queryClient);
      queryClient.setQueryData(inboundKeys.all, (oldData) =>
        oldData ? [newInbound, ...oldData] : [newInbound]
      );
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
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedInbound, { id }) => {
      invalidateInbound(queryClient);
      queryClient.setQueryData(inboundKeys.all, (oldData) =>
        oldData?.map((item) => (item.id === id ? { ...item, ...updatedInbound } : item))
      );
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
      queryClient.setQueryData(inboundKeys.all, (oldData) =>
        oldData?.filter((item) => item.id !== deletedInbound.id)
      );
      showSuccess('Movimento IN eliminato con successo');
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del movimento IN: ${error.message}`);
    },
  });
};

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
