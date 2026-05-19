import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCreateOperator, useUpdateOperator, useOperator } from '../hooks';
import {GenericForm, LoadingSkeleton} from '../ui';

function OperatorsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const { data: editingItem, isLoading, isError } = useOperator(isEdit ? id : null);

  useEffect(() => {
    if (isError) navigate('/operators/list');
  }, [isError, navigate]);

  // Use centralized mutation hooks
  const createMutation = useCreateOperator();
  const updateMutation = useUpdateOperator();

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
    navigate('/operators/list');
  };

  const handleCancel = () => {
    navigate('/operators/list');
  };

  // Form configuration
  const formConfig = {
    sections: [
      {
        title: 'Informazioni Generali',
        fields: [
          {
            name: 'name',
            label: 'Nome Operatore',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome operatore'
          },
          {
            name: 'code',
            label: 'Codice Operatore',
            type: 'text',
            placeholder: 'Inserisci codice operatore'
          },
          {
            name: 'role',
            label: 'Ruolo',
            type: 'select',
            required: true,
            options: [
              { value: 'Operatore', label: 'Operatore' },
              { value: 'Supervisore', label: 'Supervisore' },
              { value: 'Manager', label: 'Manager' },
              { value: 'Amministratore', label: 'Amministratore' }
            ]
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
    addButtonText: 'Aggiungi Operatore',
    editButtonText: 'Aggiorna Operatore',
    addLoadingText: 'Aggiungendo...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Creazione operatore',
    editContext: 'Aggiornamento operatore',
    addErrorMessage: 'Errore durante la creazione dell\'operatore',
    editErrorMessage: 'Errore durante l\'aggiornamento dell\'operatore'
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          {editingItem ? 'Modifica Operatore' : 'Nuovo Operatore'}
        </h1>
      </div>

      
      <GenericForm
        config={formConfig}
        initialData={editingItem ? {
          ...editingItem,
          // Convert boolean values to strings for Select components
          active: String(editingItem.active)
        } : {}}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditMode={!!editingItem}
        isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
      />
    </div>
  );
}

export default OperatorsPage;



