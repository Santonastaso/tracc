import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import GenericForm from '../components/GenericForm';
import SiloCard from '../components/SiloCard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { showSuccess, showError } from '../utils/toast';

function SilosPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  // Fetch silos data with current levels and available lots
  const { data: silosData, isLoading } = useQuery({
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
          id,
          silo_id,
          quantity_kg,
          created_at,
          product,
          lot_supplier,
          lot_tf
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
              available_quantity: inbound.quantity_kg,
              materials: { name: inbound.product }
            });
          } else if (remainingOutbound < inbound.quantity_kg) {
            // Partial outbound, some of this item is available
            const available = inbound.quantity_kg - remainingOutbound;
            availableItems.push({
              ...inbound,
              available_quantity: available,
              materials: { name: inbound.product }
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

  // Fetch materials for allowed_material_ids
  const { data: materialsData } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
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
      const dataToSave = {
        ...formData,
        capacity_kg: parseInt(formData.capacity_kg),
        allowed_material_ids: formData.allowed_material_ids || [],
        updated_at: new Date().toISOString()
      };

      if (editingItem) {
        const { error } = await supabase
          .from('silos')
          .update(dataToSave)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('silos')
          .insert([dataToSave]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['silos-with-levels']);
      setShowForm(false);
      setEditingItem(null);
      showSuccess(editingItem ? 'Silos aggiornato con successo' : 'Silos creato con successo');
    },
    onError: (error) => {
      showError('Errore durante il salvataggio: ' + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('silos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['silos-with-levels']);
      showSuccess('Silos eliminato con successo');
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
    if (window.confirm('Sei sicuro di voler eliminare questo silos?')) {
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
        title: 'Informazioni Silos',
        fields: [
          {
            name: 'name',
            label: 'Nome Silos',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome silos'
          },
          {
            name: 'capacity_kg',
            label: 'Capacità (Kg)',
            type: 'number',
            required: true,
            placeholder: 'Inserisci capacità in kg'
          },
          {
            name: 'allowed_material_ids',
            label: 'Materiali Consentiti',
            type: 'checkbox',
            options: materialsData?.map(m => ({ value: m.id, label: m.name })) || []
          }
        ]
      }
    ],
    addButtonText: 'Aggiungi Silos',
    editButtonText: 'Aggiorna Silos',
    addLoadingText: 'Aggiungendo...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Creazione silos',
    editContext: 'Aggiornamento silos',
    addErrorMessage: 'Errore durante la creazione del silos',
    editErrorMessage: 'Errore durante l\'aggiornamento del silos'
  };


  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-40"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-300 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Silos</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-navy-800 hover:bg-navy-700"
        >
          Aggiungi Silos
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingItem ? 'Modifica Silos' : 'Nuovo Silos'}
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Silos Disponibili</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {silosData?.map((silo) => (
            <SiloCard
              key={silo.id}
              silo={silo}
            />
          ))}
        </div>
        {silosData?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nessun silos disponibile</p>
            <p className="text-gray-400 text-sm mt-2">
              Clicca su "Aggiungi Silos" per creare il primo silos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SilosPage;
