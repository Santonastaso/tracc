import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { useCreateMaterial, useUpdateMaterial } from '../hooks';
import { FormPageLayout } from "@santonastaso/shared";

function MaterialsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching material data:', error);
            navigate('/materials/list');
          } else {
            setEditingItem(data);
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  // Use centralized mutation hooks
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();

  // Handle form submission
  const handleSubmit = async (formData) => {
    const dataToSave = {
      ...formData,
      updated_at: new Date().toISOString()
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, updates: dataToSave });
    } else {
      await createMutation.mutateAsync(dataToSave);
    }
    
    // Navigate back to list after successful submission
    navigate('/materials/list');
  };

  const handleFormSubmit = (data) => {
    handleSubmit(data);
  };

  const handleCancel = () => {
    navigate('/materials/list');
  };

  // Form configuration
  const formConfig = {
    sections: [
      {
        title: 'Informazioni Generali',
        fields: [
          {
            name: 'name',
            label: 'Nome Materiale',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome materiale'
          },
          {
            name: 'description',
            label: 'Descrizione',
            type: 'textarea',
            rows: 3,
            placeholder: 'Inserisci descrizione del materiale'
          },
          {
            name: 'unit',
            label: 'Unità di Misura',
            type: 'select',
            required: true,
            options: [
              { value: 'Kg', label: 'Kg' },
              { value: 'g', label: 'g' },
              { value: 'L', label: 'L' },
              { value: 'ml', label: 'ml' },
              { value: 'pz', label: 'Pezzi' },
              { value: 'm', label: 'Metri' },
              { value: 'm²', label: 'Metri Quadri' },
              { value: 'm³', label: 'Metri Cubi' }
            ]
          }
        ]
      },
      {
        title: 'Altre Informazioni',
        fields: [
          {
            name: 'notes',
            label: 'Note',
            type: 'textarea',
            rows: 3,
            placeholder: 'Inserisci note aggiuntive'
          },
          {
            name: 'active',
            label: 'Attivo',
            type: 'select',
            required: true,
            options: [
              { value: 'true', label: 'Sì' },
              { value: 'false', label: 'No' }
            ]
          }
        ]
      }
    ],
    addButtonText: 'Aggiungi Materiale',
    editButtonText: 'Aggiorna Materiale',
    addLoadingText: 'Aggiungendo...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Creazione materiale',
    editContext: 'Aggiornamento materiale',
    addErrorMessage: 'Errore durante la creazione del materiale',
    editErrorMessage: 'Errore durante l\'aggiornamento del materiale'
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
    <FormPageLayout
      title="Nuovo Materiale"
      editTitle="Modifica Materiale"
      isEditMode={!!editingItem}
      formConfig={formConfig}
      initialData={editingItem ? {
        ...editingItem,
        // Convert boolean values to strings for Select components
        active: String(editingItem.active)
      } : {}}
      onSubmit={handleFormSubmit}
      onCancel={handleCancel}
      isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
    />
  );
}

export default MaterialsPage;



