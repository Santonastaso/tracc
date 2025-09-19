import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase/client';
import GenericForm from '../components/GenericForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

function SilosFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
    const dataToSave = {
      ...formData,
      capacity_kg: parseInt(formData.capacity_kg),
      updated_at: new Date().toISOString()
    };

    if (editingItem) {
      const { error } = await supabase
        .from('silos')
        .update(dataToSave)
        .eq('id', editingItem.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('silos')
        .insert([dataToSave]);
      
      if (error) throw error;
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
            type: 'text',
            placeholder: 'Inserisci ID materiali separati da virgola (es: 1,2,3)',
            helpText: 'Lascia vuoto per consentire tutti i materiali'
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
          {editingItem ? 'Modifica Silos' : 'Nuovo Silos'}
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
            // Convert array to comma-separated string for display
            allowed_material_ids: editingItem.allowed_material_ids ? editingItem.allowed_material_ids.join(', ') : ''
          } : null}
          onSubmit={handleFormSubmit}
          isEditMode={!!editingItem}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}

export default SilosFormPage;
