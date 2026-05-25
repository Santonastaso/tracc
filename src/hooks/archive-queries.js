import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showSuccess, showError } from '../lib/toast';

const analysisArchiveKey = ['analysis-archive'];

// Archive rows ARE inbound rows. Any write here changes stock levels, so we
// invalidate every consumer of inbound + silos-with-levels.
const invalidateArchiveDeps = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: analysisArchiveKey });
  queryClient.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'inbound',
  });
  queryClient.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'silos',
  });
};

export const useAnalysisArchive = () =>
  useQuery({
    queryKey: analysisArchiveKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*, silos!inner(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useArchiveSave = (editingItem, { onSettled }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const now = new Date();
      const dataToSave = {
        ...formData,
        silo_id: parseInt(formData.silo_id),
        cleaned: formData.cleaned === 'true',
        updated_at: now.toISOString(),
      };

      if (editingItem) {
        const { error } = await supabase.from('inbound').update(dataToSave).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inbound').insert([dataToSave]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateArchiveDeps(queryClient);
      onSettled?.();
      showSuccess(editingItem ? 'Analisi aggiornata con successo' : 'Analisi registrata con successo');
    },
    onError: (error) => {
      showError(`Errore durante il salvataggio: ${error.message}`);
    },
  });
};

export const useArchiveDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('inbound').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateArchiveDeps(queryClient);
      showSuccess('Analisi eliminata con successo');
    },
    onError: (error) => {
      showError(`Errore durante l'eliminazione: ${error.message}`);
    },
  });
};

export const useArchiveBulkDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.from('inbound').delete().in('id', ids);
      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      invalidateArchiveDeps(queryClient);
      showSuccess(`${ids.length} analisi eliminate con successo`);
    },
    onError: (error) => {
      showError(`Errore durante l'eliminazione: ${error.message}`);
    },
  });
};
