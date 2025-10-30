import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useSilos, 
  useSilosWithLevels, 
  useOperators,
  useCreateOutbound,
  useUpdateOutbound
} from '../hooks';
import { GenericForm } from "@santonastaso/shared";
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { useParams, useNavigate } from 'react-router-dom';

function MerceOutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching outbound data:', error);
            navigate('/merce-out/list');
          } else {
            setEditingItem(data);
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  const { data: silosData } = useSilos();
  const { data: silosWithLevels } = useSilosWithLevels();
  const { data: operatorsData } = useOperators();

  // Use centralized mutation hooks
  const createMutation = useCreateOutbound();
  const updateMutation = useUpdateOutbound();

  // Handle form submission with FIFO logic
  const handleSubmit = async (formData) => {
    const { silo_id, quantity_kg, operator_name } = formData;
    
    // Convert string values back to correct types for database
    const siloId = parseInt(silo_id);
    
    // Check if silosWithLevels data is available
    if (!silosWithLevels || silosWithLevels.length === 0) {
      throw new Error('Dati silos non disponibili. Riprova tra qualche secondo.');
    }
    
    // Get available items for the selected silo
    const silo = silosWithLevels.find(s => s.id === siloId);
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
        material_name: item.product,
        supplier_lot: item.lot_supplier,
        tf_lot: item.lot_tf,
        protein_content: item.proteins,
        moisture_content: item.humidity,
        cleaning_status: item.cleaned,
        entry_date: item.created_at.split('T')[0]
      });
      
      remainingQuantity -= withdrawFromThisItem;
    }
    
    if (remainingQuantity > 0) {
      throw new Error('Errore nel calcolo FIFO: quantità rimanente non gestita');
    }
    
    const dataToSave = {
      silo_id: siloId,
      quantity_kg: parseFloat(quantity_kg),
      operator_name: operator_name,
      items: itemsToWithdraw,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, updates: dataToSave });
    } else {
      await createMutation.mutateAsync(dataToSave);
    }
    
    // Navigate back to list after successful submission
    navigate('/merce-out/list');
  };

  const handleFormSubmit = (data) => {
    handleSubmit(data);
  };

  const handleCancel = () => {
    navigate('/merce-out/list');
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
              value: String(s.id), 
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
            options: operatorsData?.map(o => ({ 
              value: o.name, 
              label: `${o.name}${o.code ? ` (${o.code})` : ''}` 
            })) || []
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
        <h1 className="text-2xl font-bold text-foreground">
          {editingItem ? 'Modifica Prelievo Merce OUT' : 'Nuovo Prelievo Merce OUT'}
        </h1>
        <Button variant="outline" onClick={handleCancel}>
          Annulla
        </Button>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        {!silosWithLevels || silosWithLevels.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Caricamento dati silos...
          </div>
        ) : (
          <GenericForm
            config={formConfig}
            initialData={editingItem ? {
              ...editingItem,
              // Convert database values to strings for Select components
              silo_id: String(editingItem.silo_id)
            } : {}}
            onSubmit={handleFormSubmit}
            isEditMode={!!editingItem}
            isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
          />
        )}
      </Card>
    </div>
  );
}

export default MerceOutPage;
