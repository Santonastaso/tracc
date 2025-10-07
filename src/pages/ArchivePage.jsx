import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useSilos, useMaterials } from '../hooks';
import DataTable from '../components/DataTable';
import GenericForm from '../components/GenericForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

function ArchivePage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch archive data (we'll use a custom table for analysis archive)
  const { data: archiveData, isLoading } = useQuery({
    queryKey: ['analysis-archive'],
    queryFn: async () => {
      // For now, we'll use the inbound table as our analysis archive
      // In a real implementation, you might want a separate analysis_archive table
      const { data, error } = await supabase
        .from('inbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch data using centralized query hooks
  const { data: materialsData } = useMaterials();
  const { data: silosData } = useSilos();

  // Fetch suppliers for dropdown
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch operators for dropdown
  const { data: operatorsData } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (formData) => {
      const now = new Date();
      const dataToSave = {
        ...formData,
        entry_date: now.toISOString().split('T')[0],
        entry_time: now.toTimeString().split(' ')[0],
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inbound')
          .update(dataToSave)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inbound')
          .insert([dataToSave]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['analysis-archive']);
      setShowForm(false);
      setEditingItem(null);
      showSuccess(editingItem ? 'Analisi aggiornata con successo' : 'Analisi registrata con successo');
    },
    onError: (error) => {
      showError('Errore durante il salvataggio: ' + error.message);
    }
  });

  const queryClient = useQueryClient();
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('inbound')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['analysis-archive']);
      showSuccess('Analisi eliminata con successo');
    },
    onError: (error) => {
      showError('Errore durante l\'eliminazione: ' + error.message);
    }
  });

  // Bulk delete
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('inbound')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['analysis-archive'])
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questa analisi?')) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleFormSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Form configuration
  const formConfig = {
    sections: [
      {
        title: 'Informazioni Generali',
        fields: [
          {
            name: 'ddt_number',
            label: 'Numero DDT',
            type: 'number',
            required: true,
            placeholder: 'Inserisci numero DDT'
          },
          {
            name: 'material_id',
            label: 'Prodotto',
            type: 'select',
            required: true,
            options: materialsData?.map(m => ({ value: m.id, label: m.name })) || []
          },
          {
            name: 'quantity_kg',
            label: 'Quantità (Kg)',
            type: 'number',
            required: true,
            placeholder: 'Inserisci quantità in kg'
          },
          {
            name: 'silo_id',
            label: 'Silos Destinazione',
            type: 'select',
            required: true,
            options: silosData?.map(s => ({ value: s.id, label: s.name })) || []
          }
        ]
      },
      {
        title: 'Dettagli Lotto',
        fields: [
          {
            name: 'supplier_lot',
            label: 'Lotto Fornitore',
            type: 'text',
            placeholder: 'Inserisci lotto fornitore'
          },
          {
            name: 'tf_lot',
            label: 'Lotto TF',
            type: 'text',
            placeholder: 'Inserisci lotto TF'
          },
          {
            name: 'supplier_id',
            label: 'Fornitore',
            type: 'select',
            options: suppliersData?.map(s => ({ value: s.id, label: s.name })) || []
          }
        ]
      },
      {
        title: 'Analisi Qualità',
        fields: [
          {
            name: 'cleaning_status',
            label: 'Pulizia Merce',
            type: 'select',
            required: true,
            options: [
              { value: 'accepted', label: 'Accettata' },
              { value: 'rejected', label: 'Non Accettata' }
            ]
          },
          {
            name: 'protein_content',
            label: 'Proteine Prodotto (%)',
            type: 'number',
            placeholder: 'Inserisci percentuale proteine'
          },
          {
            name: 'moisture_content',
            label: 'Umidità Prodotto (%)',
            type: 'number',
            placeholder: 'Inserisci percentuale umidità'
          }
        ]
      },
      {
        title: 'Operatore',
        fields: [
          {
            name: 'operator_id',
            label: 'Nome Operatore',
            type: 'select',
            required: true,
            options: operatorsData?.map(o => ({ value: o.id, label: o.name })) || []
          }
        ]
      }
    ],
    addButtonText: 'Registra Analisi',
    editButtonText: 'Aggiorna Analisi',
    addLoadingText: 'Registrando...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Registrazione analisi',
    editContext: 'Aggiornamento analisi',
    addErrorMessage: 'Errore durante la registrazione dell\'analisi',
    editErrorMessage: 'Errore durante l\'aggiornamento dell\'analisi'
  };

  // Table columns
  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Data/Ora',
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return date.toLocaleString('it-IT', { 
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    {
      accessorKey: 'ddt_number',
      header: 'DDT'
    },
    {
      accessorKey: 'materials.name',
      header: 'Prodotto'
    },
    {
      accessorKey: 'quantity_kg',
      header: 'Quantità (Kg)',
      cell: ({ getValue }) => `${getValue()} kg`
    },
    {
      accessorKey: 'silos.name',
      header: 'Silos'
    },
    {
      accessorKey: 'supplier_lot',
      header: 'Lotto Fornitore'
    },
    {
      accessorKey: 'tf_lot',
      header: 'Lotto TF'
    },
    {
      accessorKey: 'cleaning_status',
      header: 'Pulizia',
      cell: ({ getValue }) => getValue() === 'accepted' ? 'Accettata' : 'Non Accettata'
    },
    {
      accessorKey: 'protein_content',
      header: 'Proteine (%)'
    },
    {
      accessorKey: 'moisture_content',
      header: 'Umidità (%)'
    },
    {
      accessorKey: 'operators.name',
      header: 'Operatore'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-2">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Archivio Analisi</h1>
          <p className="text-gray-600 mt-1">
            Registra e gestisci tutti i valori di ogni analisi per migliorare la tracciabilità
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className=""
        >
          Registra Analisi
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingItem ? 'Modifica Analisi' : 'Nuova Analisi'}
            </h2>
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
          </div>
          <GenericForm
            config={formConfig}
            initialData={editingItem}
            onSubmit={handleFormSubmit}
            isEditMode={!!editingItem}
            isLoading={mutation.isPending}
          />
        </Card>
      )}

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Storico Analisi</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={archiveData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['materials.name', 'silos.name', 'cleaning_status', 'operators.name']}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>
    </div>
  );
}

export default ArchivePage;
