import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateMaterial, useUpdateMaterial, useMaterial } from '../hooks';
import {FormPageLayout, LoadingSkeleton} from '../ui';

function MaterialsFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const { data: editingItem, isLoading, isError } = useMaterial(isEdit ? id : null);

  useEffect(() => {
    if (isError) navigate('/materials/list');
  }, [isError, navigate]);

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
    return <LoadingSkeleton />;
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
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
    />
  );
}

export default MaterialsFormPage;



