import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import DataTable from '../components/DataTable';
import GenericForm from '../components/GenericForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { showSuccess, showError } from '../utils/toast';

function MerceOutPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  // Fetch outbound data
  const { data: outboundData, isLoading } = useQuery({
    queryKey: ['outbound'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch silos for form dropdown
  const { data: silosData } = useQuery({
    queryKey: ['silos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('silos')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch silos with current levels for form validation
  const { data: silosWithLevels } = useQuery({
    queryKey: ['silos-with-levels'],
    queryFn: async () => {
      // Get silos
      const { data: silos, error: silosError } = await supabase
        .from('silos')
        .select('*')
        .order('id');
      
      if (silosError) throw silosError;

      // Get inbound data for each silo
      const { data: inboundData, error: inboundError } = await supabase
        .from('inbound')
        .select(`
          silo_id,
          quantity_kg,
          created_at,
          materials!inner(name),
          supplier_lot,
          tf_lot,
          protein_content,
          moisture_content,
          cleaning_status
        `)
        .order('created_at', { ascending: true }); // FIFO order
      
      if (inboundError) throw inboundError;

      // Get outbound data for each silo
      const { data: outboundData, error: outboundError } = await supabase
        .from('outbound')
        .select('silo_id, quantity_kg, items');
      
      if (outboundError) throw outboundError;

      // Calculate current levels and available items for each silo
      const silosWithData = silos.map(silo => {
        const siloInbound = inboundData.filter(item => item.silo_id === silo.id);
        const siloOutbound = outboundData.filter(item => item.silo_id === silo.id);
        
        // Calculate total outbound quantity
        const totalOutbound = siloOutbound.reduce((sum, out) => sum + out.quantity_kg, 0);
        
        // Calculate available items using FIFO logic
        let remainingOutbound = totalOutbound;
        const availableItems = [];
        
        for (const inbound of siloInbound) {
          if (remainingOutbound <= 0) {
            // All outbound has been accounted for, this item is available
            availableItems.push({
              ...inbound,
              available_quantity: inbound.quantity_kg
            });
          } else if (remainingOutbound < inbound.quantity_kg) {
            // Partial outbound, some of this item is available
            const available = inbound.quantity_kg - remainingOutbound;
            availableItems.push({
              ...inbound,
              available_quantity: available
            });
            remainingOutbound = 0;
          } else {
            // This item is completely outbound
            remainingOutbound -= inbound.quantity_kg;
          }
        }
        
        const totalInbound = siloInbound.reduce((sum, inb) => sum + inb.quantity_kg, 0);
        const currentLevel = totalInbound - totalOutbound;
        
        return {
          ...silo,
          currentLevel,
          availableItems,
          totalInbound,
          totalOutbound
        };
      });

      return silosWithData;
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
      const { silo_id, quantity_kg, operator_name } = formData;
      
      // Check if silosWithLevels data is available
      if (!silosWithLevels || silosWithLevels.length === 0) {
        throw new Error('Dati silos non disponibili. Riprova tra qualche secondo.');
      }
      
      // Get available items for the selected silo
      const silo = silosWithLevels.find(s => s.id === parseInt(silo_id));
      if (!silo) throw new Error('Silos non trovato');
      
      if (silo.currentLevel < quantity_kg) {
        throw new Error(`Quantità insufficiente nel silos. Disponibile: ${silo.currentLevel} kg`);
      }
      
      // Calculate FIFO items to withdraw
      let remainingQuantity = quantity_kg;
      const itemsToWithdraw = [];
      
      for (const item of silo.availableItems) {
        if (remainingQuantity <= 0) break;
        
        const withdrawFromThisItem = Math.min(remainingQuantity, item.available_quantity);
        itemsToWithdraw.push({
          inbound_id: item.id,
          quantity_kg: withdrawFromThisItem,
          material_name: item.materials.name,
          supplier_lot: item.supplier_lot,
          tf_lot: item.tf_lot,
          protein_content: item.protein_content,
          moisture_content: item.moisture_content,
          cleaning_status: item.cleaning_status,
          entry_date: item.created_at.split('T')[0]
        });
        
        remainingQuantity -= withdrawFromThisItem;
      }
      
      if (remainingQuantity > 0) {
        throw new Error('Errore nel calcolo FIFO: quantità rimanente non gestita');
      }
      
      const now = new Date();
      const dataToSave = {
        silo_id: parseInt(silo_id),
        quantity_kg: parseFloat(quantity_kg),
        operator_name: operator_name,
        items: itemsToWithdraw,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      if (editingItem) {
        const { error } = await supabase
          .from('outbound')
          .update(dataToSave)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('outbound')
          .insert([dataToSave]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['outbound']);
      queryClient.invalidateQueries(['silos-with-levels']);
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
        .from('outbound')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['outbound']);
      queryClient.invalidateQueries(['silos-with-levels']);
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
        title: 'Informazioni Prelievo',
        fields: [
          {
            name: 'silo_id',
            label: 'Silos di Prelievo',
            type: 'select',
            required: true,
            options: silosData?.map(s => ({ 
              value: s.id, 
              label: s.name
            })) || []
          },
          {
            name: 'quantity_kg',
            label: 'Quantità da Prelevare (Kg)',
            type: 'number',
            required: true,
            placeholder: 'Inserisci quantità da prelevare'
          },
          {
            name: 'operator_name',
            label: 'Operatore',
            type: 'select',
            required: true,
            options: operatorsData?.map(o => ({ value: o.name, label: o.name })) || []
          }
        ]
      }
    ],
    addButtonText: 'Registra Prelievo',
    editButtonText: 'Aggiorna Prelievo',
    addLoadingText: 'Registrando...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Registrazione prelievo merce',
    editContext: 'Aggiornamento prelievo merce',
    addErrorMessage: 'Errore durante la registrazione del prelievo',
    editErrorMessage: 'Errore durante l\'aggiornamento del prelievo'
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
      accessorKey: 'silos.name',
      header: 'Silos'
    },
    {
      accessorKey: 'quantity_kg',
      header: 'Quantità (Kg)',
      cell: ({ getValue }) => `${getValue()} kg`
    },
    {
      accessorKey: 'operator_name',
      header: 'Operatore'
    },
    {
      accessorKey: 'items',
      header: 'Dettagli Prelievo',
      cell: ({ getValue }) => {
        const items = getValue();
        if (!items || items.length === 0) return 'N/A';
        
        return (
          <div className="text-xs">
            {items.map((item, index) => (
              <div key={index} className="mb-1">
                <strong>{item.material_name}</strong>: {item.quantity_kg}kg
                {item.supplier_lot && ` (Lotto: ${item.supplier_lot})`}
              </div>
            ))}
          </div>
        );
      }
    }
  ];

  if (isLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Gestione Merce OUT</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-navy-800 hover:bg-navy-700"
        >
          Registra Prelievo
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingItem ? 'Modifica Prelievo' : 'Nuovo Prelievo'}
            </h2>
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
          </div>
          {!silosWithLevels || silosWithLevels.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Caricamento dati silos...
            </div>
          ) : (
            <GenericForm
              config={formConfig}
              initialData={editingItem}
              onSubmit={handleFormSubmit}
              isEditMode={!!editingItem}
              isLoading={mutation.isPending}
            />
          )}
        </Card>
      )}

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Prelievi Merce OUT</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={outboundData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['silos.name', 'operator_name']}
          />
        </div>
      </Card>
    </div>
  );
}

export default MerceOutPage;
