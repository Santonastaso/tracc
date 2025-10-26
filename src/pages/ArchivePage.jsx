import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useSilos, useMaterials } from '../hooks';
import DataTable from '../components/DataTable';
import GenericForm from '../components/GenericForm';
import { Button } from '@santonastaso/crm-ui';
import { Card } from '@santonastaso/crm-ui';
import { showSuccess, showError } from '../utils';

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
      
      // Debug: Log the data to see what we're getting
      console.log('Archive data:', data);
      console.log('First item:', data?.[0]);
      
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
        // Convert string values to correct types for database
        silo_id: parseInt(formData.silo_id),
        cleaned: formData.cleaned === 'true',
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
            name: 'product',
            label: 'Prodotto',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome prodotto'
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
          },
          {
            name: 'lot_supplier',
            label: 'Fornitore',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome fornitore'
          }
        ]
      },
      {
        title: 'Dettagli Lotto',
        fields: [
          {
            name: 'lot_tf',
            label: 'Lotto TF',
            type: 'text',
            placeholder: 'Inserisci lotto TF'
          }
        ]
      },
      {
        title: 'Analisi Qualità',
        fields: [
          {
            name: 'cleaned',
            label: 'Pulizia Merce',
            type: 'select',
            required: true,
            options: [
              { value: 'true', label: 'Accettata' },
              { value: 'false', label: 'Non Accettata' }
            ]
          },
          {
            name: 'proteins',
            label: 'Proteine Prodotto (%)',
            type: 'number',
            placeholder: 'Inserisci percentuale proteine'
          },
          {
            name: 'humidity',
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
            name: 'operator_name',
            label: 'Nome Operatore',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome operatore'
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
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => `#${getValue()}`
    },
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
      accessorKey: 'product',
      header: 'Prodotto'
    },
    {
      accessorKey: 'quantity_kg',
      header: 'Quantità (Kg)',
      cell: ({ getValue }) => `${getValue()} kg`
    },
    {
      accessorKey: 'silos.name',
      header: 'Silos',
      cell: ({ row }) => row.original.silos?.name || 'N/A'
    },
    {
      accessorKey: 'lot_supplier',
      header: 'Fornitore'
    },
    {
      accessorKey: 'lot_tf',
      header: 'Lotto TF',
      cell: ({ getValue }) => {
        const value = getValue();
        console.log('Lot TF value:', value);
        return value || 'N/A';
      }
    },
    {
      accessorKey: 'cleaned',
      header: 'Pulizia',
      cell: ({ getValue }) => {
        const value = getValue();
        console.log('Cleaned value:', value, typeof value);
        return value ? 'Accettata' : 'Non Accettata';
      }
    },
    {
      accessorKey: 'proteins',
      header: 'Proteine (%)',
      cell: ({ getValue }) => getValue() ? `${getValue()}%` : 'N/A'
    },
    {
      accessorKey: 'humidity',
      header: 'Umidità (%)',
      cell: ({ getValue }) => getValue() ? `${getValue()}%` : 'N/A'
    },
    {
      accessorKey: 'operator_name',
      header: 'Operatore',
      cell: ({ getValue }) => {
        const value = getValue();
        console.log('Operator name value:', value);
        return value || 'N/A';
      }
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
            filterableColumns={['product', 'silos.name', 'cleaned', 'operator_name', 'lot_supplier']}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>
    </div>
  );
}

export default ArchivePage;
