import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { useCreateOperator, useUpdateOperator } from '../hooks';
import GenericForm from '../components/GenericForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

function OperatorsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      supabase
        .from('operators')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching operator data:', error);
            navigate('/operators/list');
          } else {
            setEditingItem(data);
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

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

  const handleFormSubmit = (data) => {
    handleSubmit(data);
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
          {editingItem ? 'Modifica Operatore' : 'Nuovo Operatore'}
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
            // Convert boolean values to strings for Select components
            active: String(editingItem.active)
          } : null}
          onSubmit={handleFormSubmit}
          isEditMode={!!editingItem}
          isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
        />
      </Card>
    </div>
  );
}

export default OperatorsPage;
