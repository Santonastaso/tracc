import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useSilos, 
  useMaterials, 
  useOperators,
  useCreateInbound,
  useUpdateInbound
} from '../hooks';
import GenericForm from '../components/GenericForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useParams, useNavigate } from 'react-router-dom';

function MerceInPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

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
            // Set the selected material for filtering
            if (data.product) {
              setSelectedMaterial(data.product);
            }
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  const { data: silosData } = useSilos();
  const { data: materialsData, isLoading: materialsLoading, error: materialsError } = useMaterials();
  const { data: operatorsData, isLoading: operatorsLoading, error: operatorsError } = useOperators();

  // Filter silos based on selected material
  const filteredSilos = useMemo(() => {
    if (!silosData || !selectedMaterial) {
      return silosData || [];
    }

    // Find the material ID from the selected material name
    const material = materialsData?.find(m => m.name === selectedMaterial);
    if (!material) {
      return silosData;
    }

    // Filter silos that allow this material
    return silosData.filter(silo => {
      // If silo has no allowed_material_ids, it allows all materials
      if (!silo.allowed_material_ids || silo.allowed_material_ids.length === 0) {
        return true;
      }
      // Check if the material ID is in the allowed list
      return silo.allowed_material_ids.includes(material.id);
    });
  }, [silosData, selectedMaterial, materialsData]);

  // Use centralized mutation hooks
  const createMutation = useCreateInbound();
  const updateMutation = useUpdateInbound();

  // Handle form submission
  const handleSubmit = async (formData) => {
    const dataToSave = {
      ...formData,
      // Convert string values back to correct types for database
      silo_id: parseInt(formData.silo_id),
      cleaned: formData.cleaned === 'true',
      updated_at: new Date().toISOString()
    };

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
            setValue('silo_id', '');
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
            type: 'number',
            required: true,
            placeholder: 'Inserisci quantità in kg'
          },
          {
            name: 'silo_id',
            label: 'Silos Destinazione',
            type: 'select',
            required: true,
            options: filteredSilos?.length > 0 
              ? filteredSilos.map(s => ({ value: String(s.id), label: s.name }))
              : selectedMaterial 
                ? [{ value: '', label: 'Nessun silos compatibile con questo materiale' }]
                : [{ value: '', label: 'Seleziona prima un prodotto' }],
            placeholder: selectedMaterial 
              ? (filteredSilos?.length > 0 ? 'Seleziona silos compatibile' : 'Nessun silos disponibile')
              : 'Seleziona prima un prodotto',
            disabled: selectedMaterial && filteredSilos?.length === 0,
            helpText: selectedMaterial 
              ? (filteredSilos?.length > 0 
                  ? `${filteredSilos.length} silos compatibili con "${selectedMaterial}"`
                  : `Nessun silos configurato per accettare "${selectedMaterial}"`)
              : 'Seleziona un prodotto per vedere i silos compatibili'
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
        <h1 className="text-2xl font-bold text-gray-900">
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
          } : null}
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
