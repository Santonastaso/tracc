import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateSupplier, useUpdateSupplier, useSupplier } from '../hooks';
import {FormPageLayout, LoadingSkeleton} from '../ui';

function SuppliersFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const { data: editingItem, isLoading, isError } = useSupplier(isEdit ? id : null);

  useEffect(() => {
    if (isError) navigate('/suppliers/list');
  }, [isError, navigate]);

  // Use centralized mutation hooks
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

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
    navigate('/suppliers/list');
  };

  const handleCancel = () => {
    navigate('/suppliers/list');
  };

  // Form configuration
  const formConfig = {
    sections: [
      {
        title: 'Informazioni Generali',
        fields: [
          {
            name: 'name',
            label: 'Nome Fornitore',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome fornitore'
          },
          {
            name: 'code',
            label: 'Codice Fornitore',
            type: 'text',
            placeholder: 'Inserisci codice fornitore'
          },
          {
            name: 'contact_person',
            label: 'Persona di Contatto',
            type: 'text',
            placeholder: 'Inserisci nome persona di contatto'
          },
          // TODO: reconcile `status` (string enum) with boolean `active` — out of scope for cleanup
          {
            name: 'status',
            label: 'Stato',
            type: 'select',
            required: true,
            options: [
              { value: 'active', label: 'Attivo' },
              { value: 'inactive', label: 'Inattivo' },
              { value: 'suspended', label: 'Sospeso' }
            ]
          }
        ]
      },
      {
        title: 'Contatti',
        fields: [
          {
            name: 'address',
            label: 'Indirizzo',
            type: 'textarea',
            rows: 3,
            placeholder: 'Inserisci indirizzo completo'
          },
          {
            name: 'phone',
            label: 'Telefono',
            type: 'text',
            placeholder: 'Inserisci numero di telefono'
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            placeholder: 'Inserisci indirizzo email'
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
    addButtonText: 'Aggiungi Fornitore',
    editButtonText: 'Aggiorna Fornitore',
    addLoadingText: 'Aggiungendo...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Creazione fornitore',
    editContext: 'Aggiornamento fornitore',
    addErrorMessage: 'Errore durante la creazione del fornitore',
    editErrorMessage: 'Errore durante l\'aggiornamento del fornitore'
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <FormPageLayout
      title="Nuovo Fornitore"
      editTitle="Modifica Fornitore"
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

export default SuppliersFormPage;



