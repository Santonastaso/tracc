import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { useMaterials, useCreateSilo, useUpdateSilo } from '../hooks';
import { FormPageLayout } from "@santonastaso/shared";

function SilosFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch materials data for the checkbox selection
  const { data: materialsData, isLoading: materialsLoading } = useMaterials();

  // Use centralized mutation hooks with cache invalidation
  const createMutation = useCreateSilo();
  const updateMutation = useUpdateSilo();

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      supabase
        .from('silos')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching silo data:', error);
            navigate('/silos/list');
          } else {
            setEditingItem(data);
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    // Ensure allowed_material_ids is an array of integers
    let allowedMaterialIds = [];
    if (Array.isArray(formData.allowed_material_ids)) {
      allowedMaterialIds = formData.allowed_material_ids.filter(id => !isNaN(id));
    } else if (typeof formData.allowed_material_ids === 'string' && formData.allowed_material_ids.trim()) {
      // Fallback for string format (comma-separated)
      allowedMaterialIds = formData.allowed_material_ids
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
    }

    const dataToSave = {
      ...formData,
      capacity_kg: parseInt(formData.capacity_kg),
      allowed_material_ids: allowedMaterialIds,
      updated_at: new Date().toISOString()
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, updates: dataToSave });
    } else {
      await createMutation.mutateAsync(dataToSave);
    }
    
    // Navigate back to list after successful submission
    navigate('/silos/list');
  };

  const handleFormSubmit = (data) => {
    handleSubmit(data);
  };

  const handleCancel = () => {
    navigate('/silos/list');
  };

  // Custom field renderer for material selection
  const customFieldRenderers = {
    'allowed_material_ids': (field, { setValue, getValues }) => {
      const selectedIds = getValues(field.name) || [];
      
      return (
        <div className="space-y-2">
          <div className="text-[10px] text-gray-600 mb-2">
            Seleziona i materiali che questo silos può accettare. Lascia vuoto per accettare tutti i materiali.
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
            {materialsData?.map(material => (
              <label key={material.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(material.id)}
                  onChange={(e) => {
                    const currentIds = getValues(field.name) || [];
                    if (e.target.checked) {
                      setValue(field.name, [...currentIds, material.id]);
                    } else {
                      setValue(field.name, currentIds.filter(id => id !== material.id));
                    }
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-[10px] font-medium">{material.name}</span>
              </label>
            ))}
          </div>
          {selectedIds.length > 0 && (
            <div className="text-[9px] text-gray-500">
              {selectedIds.length} materiali selezionati
            </div>
          )}
        </div>
      );
    }
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
          }
        ]
      },
      {
        title: 'Configurazione Materiali',
        fields: [
          {
            name: 'allowed_material_ids',
            label: 'Materiali Consentiti',
            type: 'allowed_material_ids', // Custom type for checkbox selection
            helpText: 'Seleziona i materiali che questo silos può accettare'
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

  if (isLoading || materialsLoading) {
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
    <FormPageLayout
      title="Nuovo Silos"
      editTitle="Modifica Silos"
      isEditMode={!!editingItem}
      formConfig={formConfig}
      initialData={editingItem ? {
        ...editingItem,
        // Keep allowed_material_ids as array for checkbox selection
        allowed_material_ids: editingItem.allowed_material_ids || []
      } : {}}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
      customFieldRenderers={customFieldRenderers}
    />
  );
}

export default SilosFormPage;



