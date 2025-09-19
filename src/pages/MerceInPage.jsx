import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { fetchMaterials } from '../services/materials';
import { fetchOperators } from '../services/operators';
import { fetchSilos } from '../services/silos';
import DataTable from '../components/DataTable';
import GenericForm from '../components/GenericForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { showSuccess, showError } from '../utils/toast';

function MerceInPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  // Fetch inbound data
  const { data: inboundData, isLoading } = useQuery({
    queryKey: ['inbound'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch silos for dropdown
  const { data: silosData } = useQuery({
    queryKey: ['silos'],
    queryFn: fetchSilos
  });

  // Fetch materials for dropdown
  const { data: materialsData, isLoading: materialsLoading, error: materialsError } = useQuery({
    queryKey: ['materials'],
    queryFn: fetchMaterials,
    onError: (error) => {
      showError('Errore nel caricamento dei materiali: ' + error.message);
    }
  });

  // Fetch operators for dropdown
  const { data: operatorsData, isLoading: operatorsLoading, error: operatorsError } = useQuery({
    queryKey: ['operators'],
    queryFn: fetchOperators,
    onError: (error) => {
      showError('Errore nel caricamento degli operatori: ' + error.message);
    }
  });


  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (formData) => {
      const now = new Date();
      const dataToSave = {
        ...formData,
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
      queryClient.invalidateQueries(['inbound']);
      setShowForm(false);
      setEditingItem(null);
      showSuccess(editingItem ? 'Movimento aggiornato con successo' : 'Movimento creato con successo');
    },
    onError: (error) => {
      showError('Errore durante il salvataggio: ' + error.message);
    }
  });

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
      queryClient.invalidateQueries(['inbound']);
      showSuccess('Movimento eliminato con successo');
    },
    onError: (error) => {
      showError('Errore durante l\'eliminazione: ' + error.message);
    }
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo movimento?')) {
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
            type: 'select',
            required: true,
            options: materialsData?.length > 0 
              ? materialsData.map(m => ({ 
                  value: m.name, 
                  label: `${m.name} (${m.unit || 'Kg'})` 
                }))
              : [{ value: '', label: 'Caricamento materiali...' }]
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
            name: 'lot_supplier',
            label: 'Lotto Fornitore',
            type: 'text',
            placeholder: 'Inserisci lotto fornitore'
          },
          {
            name: 'lot_tf',
            label: 'Lotto TF',
            type: 'text',
            placeholder: 'Inserisci lotto TF'
          }
        ]
      },
      {
        title: 'Controlli Qualità',
        fields: [
          {
            name: 'cleaned',
            label: 'Pulizia Merce',
            type: 'select',
            required: true,
            options: [
              { value: true, label: 'Accettata' },
              { value: false, label: 'Non Accettata' }
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
            type: 'select',
            required: true,
            options: operatorsData?.length > 0 
              ? operatorsData.map(o => ({ 
                  value: o.name, 
                  label: `${o.name}${o.code ? ` (${o.code})` : ''}` 
                }))
              : [{ value: '', label: 'Caricamento operatori...' }]
          }
        ]
      }
    ],
    addButtonText: 'Aggiungi Movimento',
    editButtonText: 'Aggiorna Movimento',
    addLoadingText: 'Aggiungendo...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Creazione movimento merce in entrata',
    editContext: 'Aggiornamento movimento merce in entrata',
    addErrorMessage: 'Errore durante la creazione del movimento',
    editErrorMessage: 'Errore durante l\'aggiornamento del movimento'
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
      accessorKey: 'product',
      header: 'Prodotto',
      cell: ({ getValue, row }) => {
        const product = getValue();
        // Try to find the material to show unit
        const material = materialsData?.find(m => m.name === product);
        return material ? `${product} (${material.unit || 'Kg'})` : product;
      }
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
      header: 'Lotto Fornitore'
    },
    {
      accessorKey: 'lot_tf',
      header: 'Lotto TF'
    },
    {
      accessorKey: 'cleaned',
      header: 'Pulizia',
      cell: ({ getValue }) => getValue() ? 'Accettata' : 'Non Accettata'
    },
    {
      accessorKey: 'proteins',
      header: 'Proteine (%)'
    },
    {
      accessorKey: 'humidity',
      header: 'Umidità (%)'
    },
    {
      accessorKey: 'operator_name',
      header: 'Operatore'
    }
  ];

  if (isLoading || materialsLoading || operatorsLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Merce IN</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-navy-800 hover:bg-navy-700"
        >
          Aggiungi Movimento
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingItem ? 'Modifica Movimento' : 'Nuovo Movimento'}
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
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Movimenti Merce IN</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={inboundData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['product', 'operator_name']}
          />
        </div>
      </Card>
    </div>
  );
}

export default MerceInPage;
