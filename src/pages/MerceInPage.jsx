import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useSilosWithLevels, 
  useMaterials, 
  useOperators,
  useCreateInbound,
  useUpdateInbound
} from '../hooks';
import { GenericForm } from "@santonastaso/shared";
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { useParams, useNavigate } from 'react-router-dom';

function MerceInPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantity, setQuantity] = useState('');

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      supabase
        .from('inbound')
        .select('*, silos(name)')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching inbound data:', error);
            navigate('/merce-in/list');
          } else {
            setEditingItem(data);
            // Set the selected material and quantity for filtering
            if (data.product) {
              setSelectedMaterial(data.product);
            }
            if (data.quantity_kg) {
              setQuantity(String(data.quantity_kg));
            }
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  const { data: silosData } = useSilosWithLevels();
  const { data: materialsData, isLoading: materialsLoading, error: materialsError } = useMaterials();
  const { data: operatorsData, isLoading: operatorsLoading, error: operatorsError } = useOperators();

  // Filter silos based on selected material and capacity
  const filteredSilos = useMemo(() => {
    if (!silosData || !selectedMaterial) {
      return silosData || [];
    }

    // Find the material ID from the selected material name
    const material = materialsData?.find(m => m.name === selectedMaterial);
    if (!material) {
      return silosData;
    }

    // Parse quantity for capacity validation
    const quantityToAdd = parseFloat(quantity) || 0;

    // Filter silos that allow this material and have enough capacity
    return silosData.filter(silo => {
      // First check if silo allows this material
      let materialAllowed = true;
      if (silo.allowed_material_ids && silo.allowed_material_ids.length > 0) {
        materialAllowed = silo.allowed_material_ids.includes(material.id);
      }

      if (!materialAllowed) {
        return false;
      }

      // Then check capacity if quantity is specified
      if (quantityToAdd > 0) {
        const currentLevel = silo.currentLevel || 0;
        const capacity = silo.capacity_kg || 0;
        const availableCapacity = capacity - currentLevel;
        
        // Only show silos that can accommodate the quantity without exceeding 100%
        return availableCapacity >= quantityToAdd;
      }

      return true;
    });
  }, [silosData, selectedMaterial, materialsData, quantity]);

  // Use centralized mutation hooks
  const createMutation = useCreateInbound();
  const updateMutation = useUpdateInbound();

  // Handle form submission
  const handleSubmit = async (formData) => {
    // Validate that placeholder values are not selected
    if (formData.silo_id === 'no-silos' || formData.silo_id === 'select-product') {
      alert('Seleziona un silos valido');
      return;
    }
    
    if (formData.operator_name === 'loading') {
      alert('Seleziona un operatore valido');
      return;
    }

    const dataToSave = {
      ...formData,
      // Convert string values back to correct types for database
      silo_id: parseInt(formData.silo_id),
      cleaned: formData.cleaned === 'true',
      // Map fornitore to lot_supplier for database
      lot_supplier: formData.fornitore,
      updated_at: new Date().toISOString()
    };
    
    // Remove fornitore field before saving to database
    delete dataToSave.fornitore;

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, updates: dataToSave });
    } else {
      await createMutation.mutateAsync(dataToSave);
    }
    
    // Navigate back to list after successful submission
    navigate('/merce-in/list');
  };

  const handleFormSubmit = (data) => {
    handleSubmit(data);
  };

  const handleCancel = () => {
    navigate('/merce-in/list');
  };

  // Custom field renderers for dynamic behavior
  const customFieldRenderers = {
    'product': (field, { setValue, getValues }) => {
      return (
        <select
          id={field.name}
          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-800 focus:border-transparent text-[10px]"
          value={getValues(field.name) || ''}
          onChange={(e) => {
            const value = e.target.value;
            setValue(field.name, value);
            setSelectedMaterial(value);
            // Clear silo selection when material changes
            setValue('silo_id', 'select-product');
          }}
          required={field.required}
        >
          <option value="">Seleziona prodotto</option>
          {materialsData?.map(m => (
            <option key={m.id} value={m.name}>
              {m.name} ({m.unit || 'Kg'})
            </option>
          ))}
        </select>
      );
    },
    'quantity_kg': (field, { setValue, getValues }) => {
      return (
        <input
          id={field.name}
          type="number"
          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-800 focus:border-transparent text-[10px]"
          value={getValues(field.name) || ''}
          onChange={(e) => {
            const value = e.target.value;
            setValue(field.name, value);
            setQuantity(value);
            // Clear silo selection when quantity changes
            setValue('silo_id', 'select-product');
          }}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
    }
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
            type: 'product', // Custom type for dynamic behavior
            required: true
          },
          {
            name: 'quantity_kg',
            label: 'Quantità (Kg)',
            type: 'quantity_kg', // Custom type for dynamic behavior
            required: true,
            placeholder: 'Inserisci quantità in kg'
          },
          {
            name: 'lot_supplier',
            label: 'Fornitore',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome fornitore'
          },
          {
            name: 'silo_id',
            label: 'Silos Destinazione',
            type: 'select',
            required: true,
            options: filteredSilos?.length > 0 
              ? filteredSilos.map(s => {
                  const currentLevel = s.currentLevel || 0;
                  const capacity = s.capacity_kg || 0;
                  const availableCapacity = capacity - currentLevel;
                  const utilizationPercentage = capacity > 0 ? (currentLevel / capacity) * 100 : 0;
                  
                  return {
                    value: String(s.id), 
                    label: `${s.name} (${availableCapacity.toFixed(0)}kg disponibili, ${utilizationPercentage.toFixed(1)}% utilizzato)`
                  };
                })
              : selectedMaterial 
                ? [{ value: 'no-silos', label: quantity ? 'Nessun silos con capacità sufficiente' : 'Nessun silos compatibile con questo materiale' }]
                : [{ value: 'select-product', label: 'Seleziona prima un prodotto' }],
            placeholder: selectedMaterial 
              ? (filteredSilos?.length > 0 ? 'Seleziona silos compatibile' : 'Nessun silos disponibile')
              : 'Seleziona prima un prodotto',
            disabled: selectedMaterial && filteredSilos?.length === 0,
            helpText: selectedMaterial 
              ? (filteredSilos?.length > 0 
                  ? `${filteredSilos.length} silos compatibili con "${selectedMaterial}"${quantity ? ` e con capacità sufficiente per ${quantity}kg` : ''}`
                  : quantity 
                    ? `Nessun silos con capacità sufficiente per ${quantity}kg di "${selectedMaterial}"`
                    : `Nessun silos configurato per accettare "${selectedMaterial}"`)
              : 'Seleziona un prodotto per vedere i silos compatibili'
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
        title: 'Controlli Qualità',
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
            type: 'select',
            required: true,
            options: operatorsData?.length > 0 
              ? operatorsData.map(o => ({ 
                  value: o.name, 
                  label: `${o.name}${o.code ? ` (${o.code})` : ''}` 
                }))
              : [{ value: 'loading', label: 'Caricamento operatori...' }]
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


  if (isLoading || materialsLoading || operatorsLoading) {
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
          {editingItem ? 'Modifica Movimento Merce IN' : 'Nuovo Movimento Merce IN'}
        </h1>
        <Button variant="outline" onClick={handleCancel}>
          Annulla
        </Button>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <GenericForm
          config={formConfig}
          initialData={editingItem ? {
            ...editingItem,
            // Convert database values to strings for Select components
            silo_id: String(editingItem.silo_id),
            cleaned: String(editingItem.cleaned)
          } : {}}
          onSubmit={handleFormSubmit}
          isEditMode={!!editingItem}
          isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
          customFieldRenderers={customFieldRenderers}
        />
      </Card>
    </div>
  );
}

export default MerceInPage;
