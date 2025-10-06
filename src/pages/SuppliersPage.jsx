import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import { useCreateSupplier, useUpdateSupplier } from '../hooks';
import GenericForm from '../components/GenericForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

function SuppliersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data for editing if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      setIsLoading(true);
      supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching supplier data:', error);
            navigate('/suppliers/list');
          } else {
            setEditingItem(data);
          }
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

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

  const handleFormSubmit = (data) => {
    handleSubmit(data);
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
          {editingItem ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
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

export default SuppliersPage;



