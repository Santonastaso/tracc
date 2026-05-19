import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { showSuccess, showError } from '../lib/toast';

/**
 * Factory for standard Supabase entity CRUD hooks.
 * List/detail query keys default to [table] and [table, id] for cache compatibility.
 */
export function makeEntityHooks(table, labelSingular, config = {}) {
  const displayName = config.displayName || ((row) => row?.name || row?.product || String(row?.id ?? 'Unknown'));

  const keys = {
    all: [table],
    list: (meta = {}) => (meta.queryKey ? meta.queryKey : [table, 'list', meta]),
    detail: (id) => [table, id],
  };

  const invalidateAll = (queryClient, extra = []) => {
    queryClient.invalidateQueries({ queryKey: keys.all });
    extra.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  const useList = (options = {}) => {
    const {
      orderBy = 'created_at',
      ascending = false,
      filters,
      select = '*',
      staleTime = 5 * 60 * 1000,
      enabled = true,
      queryKey,
    } = options;

    const listMeta = { orderBy, ascending, select, filters };
    const resolvedKey = queryKey ?? (orderBy === 'created_at' && !filters ? keys.all : keys.list(listMeta));

    return useQuery({
      queryKey: resolvedKey,
      enabled,
      queryFn: async () => {
        let q = supabase.from(table).select(select);
        if (orderBy) q = q.order(orderBy, { ascending });
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              q = q.eq(key, value);
            }
          });
        }
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
      },
      staleTime,
    });
  };

  const useDetail = (id, select = '*') =>
    useQuery({
      queryKey: keys.detail(id),
      queryFn: async () => {
        const { data, error } = await supabase.from(table).select(select).eq('id', id).single();
        if (error) throw error;
        return data;
      },
      enabled: !!id,
      staleTime: config.detailStaleTime ?? 5 * 60 * 1000,
    });

  const useCreate = (messages = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (payload) => {
        const { data, error } = await supabase.from(table).insert([payload]).select().single();
        if (error) throw error;
        return data;
      },
      onSuccess: (data) => {
        invalidateAll(queryClient, config.invalidateOnWrite);
        const msg =
          typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success || `${labelSingular} "${displayName(data)}" creato con successo`;
        showSuccess(msg);
      },
      onError: (error) => {
        showError(
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error || `Errore nella creazione del ${labelSingular.toLowerCase()}: ${error.message}`
        );
      },
    });
  };

  const useUpdate = (messages = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, updates }) => {
        const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      },
      onSuccess: (data, { id }) => {
        invalidateAll(queryClient, config.invalidateOnWrite);
        queryClient.setQueryData(keys.detail(id), data);
        if (messages.success !== false) {
          const msg =
            typeof messages.success === 'function'
              ? messages.success(data)
              : messages.success || `${labelSingular} "${displayName(data)}" aggiornato con successo`;
          showSuccess(msg);
        }
      },
      onError: (error) => {
        showError(
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error || `Errore nell'aggiornamento del ${labelSingular.toLowerCase()}: ${error.message}`
        );
      },
    });
  };

  const useDelete = (messages = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id) => {
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }
        const { error: delError } = await supabase.from(table).delete().eq('id', id);
        if (delError) throw delError;
        return data;
      },
      onSuccess: (deleted) => {
        invalidateAll(queryClient, config.invalidateOnWrite);
        if (!deleted) return;
        queryClient.removeQueries({ queryKey: keys.detail(deleted.id) });
        const msg =
          typeof messages.success === 'function'
            ? messages.success(deleted)
            : messages.success || `${labelSingular} "${displayName(deleted)}" eliminato con successo`;
        showSuccess(msg);
      },
      onError: (error) => {
        showError(
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error || `Errore nell'eliminazione del ${labelSingular.toLowerCase()}: ${error.message}`
        );
      },
    });
  };

  const useBulkDelete = (extraInvalidate = []) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (ids) => {
        const { error } = await supabase.from(table).delete().in('id', ids);
        if (error) throw error;
        return ids;
      },
      onSuccess: (ids) => {
        invalidateAll(queryClient, [...(config.invalidateOnWrite || []), ...extraInvalidate]);
        showSuccess(`${ids.length} elementi eliminati con successo`);
      },
      onError: (error) => {
        showError(`Errore nell'eliminazione: ${error.message}`);
      },
    });
  };

  return { keys, useList, useDetail, useCreate, useUpdate, useDelete, useBulkDelete };
}
