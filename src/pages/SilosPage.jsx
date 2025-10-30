import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useSilosWithLevels, 
  useCreateSilo, 
  useUpdateSilo, 
  useDeleteSilo,
  useMaterials 
} from '../hooks';
import { GenericForm } from "@santonastaso/shared";
import SiloCard from '../components/SiloCard';
import { SiloDetailCard } from '../components/SiloDetailCard';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';

function SilosPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedSilo, setSelectedSilo] = useState(null);

  // Fetch data using centralized query hooks
  const { data: silosData, isLoading } = useSilosWithLevels(true); // Include materials object for SilosPage
  const { data: materialsData } = useMaterials();

  // Use centralized mutation hooks
  const createMutation = useCreateSilo();
  const updateMutation = useUpdateSilo();
  const deleteMutation = useDeleteSilo();

  // Handle form submission
  const handleSubmit = async (formData) => {
    const dataToSave = {
      ...formData,
      capacity_kg: parseInt(formData.capacity_kg),
      allowed_material_ids: formData.allowed_material_ids || [],
      updated_at: new Date().toISOString()
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, updates: dataToSave });
    } else {
      await createMutation.mutateAsync(dataToSave);
    }
    
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo silos?')) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleFormSubmit = (data) => {
    handleSubmit(data);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleSiloClick = (silo) => {
    setSelectedSilo(silo);
  };

  const handleCloseDetail = () => {
    setSelectedSilo(null);
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
          },
          {
            name: 'allowed_material_ids',
            label: 'Materiali Consentiti',
            type: 'checkbox',
            options: materialsData?.map(m => ({ value: m.id, label: m.name })) || []
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
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-40"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-300 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Gestione Silos</h1>
        <Button 
          onClick={() => setShowForm(true)}
        >
          Aggiungi Silos
        </Button>
      </div>

      {showForm && (
        <Card className="p-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingItem ? 'Modifica Silos' : 'Nuovo Silos'}
            </h2>
            <Button variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
          </div>
          <GenericForm
            config={formConfig}
            initialData={editingItem || {}}
            onSubmit={handleFormSubmit}
            isEditMode={!!editingItem}
            isLoading={editingItem ? updateMutation.isPending : createMutation.isPending}
          />
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Silos Disponibili</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {silosData?.map((silo) => (
            <SiloCard
              key={silo.id}
              silo={silo}
              onClick={() => handleSiloClick(silo)}
            />
          ))}
        </div>
        {silosData?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Nessun silos disponibile</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Clicca su "Aggiungi Silos" per creare il primo silos
            </p>
          </div>
        )}
      </div>

      {/* Detail Card */}
      {selectedSilo && (
        <SiloDetailCard
          silo={selectedSilo}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default SilosPage;
