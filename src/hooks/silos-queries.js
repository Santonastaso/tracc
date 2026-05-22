import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { silosService } from '../lib/silos-service';
import { showSuccess, showError } from '../lib/toast';

export const silosKeys = {
  all: ['silos'],
  detail: (id) => ['silos', id],
  list: ['silos', 'list'],
  withLevels: ['silos', 'withLevels'],
};

const invalidateSilos = (queryClient) => {
  queryClient.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'silos',
  });
};

export const useSilos = () =>
  useQuery({
    queryKey: silosKeys.all,
    queryFn: () => silosService.getSilosWithLevels(),
    staleTime: 5 * 60 * 1000,
  });

export const useSilo = (id) =>
  useQuery({
    queryKey: silosKeys.detail(id),
    queryFn: () => silosService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useSilosWithLevels = (includeMaterials = false) =>
  useQuery({
    queryKey: [...silosKeys.withLevels, includeMaterials],
    queryFn: () => silosService.getSilosWithLevels(includeMaterials),
    staleTime: 2 * 60 * 1000,
  });

export const useSilosList = () =>
  useQuery({
    queryKey: silosKeys.list,
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

export const useCreateSilo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (siloData) => silosService.createSilo(siloData),
    onSuccess: (newSilo) => {
      invalidateSilos(queryClient);
      queryClient.setQueryData(silosKeys.all, (oldData) =>
        oldData ? [...oldData, newSilo] : [newSilo]
      );
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
      invalidateSilos(queryClient);
      queryClient.setQueryData(silosKeys.all, (oldData) =>
        oldData?.map((silo) => (silo.id === id ? { ...silo, ...updatedSilo } : silo))
      );
      queryClient.setQueryData(silosKeys.detail(id), updatedSilo);
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
      invalidateSilos(queryClient);
      if (!deletedSilo) return;
      queryClient.setQueryData(silosKeys.all, (oldData) =>
        oldData?.filter((silo) => silo.id !== deletedSilo.id)
      );
      queryClient.removeQueries({ queryKey: silosKeys.detail(deletedSilo.id) });
      showSuccess(`Silo "${deletedSilo?.name || 'Unknown'}" eliminato con successo`);
    },
    onError: (error) => {
      showError(`Errore nell'eliminazione del silo: ${error.message}`);
    },
  });
};

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
