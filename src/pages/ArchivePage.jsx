import React, { useState } from 'react';
import { confirmDelete } from '../lib/confirm';
import { useSilos } from '../hooks';
import {
  useAnalysisArchive,
  useArchiveSave,
  useArchiveDelete,
  useArchiveBulkDelete,
} from '../hooks';
import { DataTable, GenericForm, Button, Card, LoadingSkeleton } from '../ui';
import { formatDateTime } from '../lib/format';

function ArchivePage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: archiveData, isLoading } = useAnalysisArchive();
  const { data: silosData } = useSilos();

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const mutation = useArchiveSave(editingItem, { onSettled: closeForm });
  const deleteMutation = useArchiveDelete();
  const bulkDelete = useArchiveBulkDelete();

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!(await confirmDelete('questa analisi'))) return;
    deleteMutation.mutate(item.id);
  };

  const handleFormSubmit = (data) => mutation.mutateAsync(data);

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
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
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome prodotto'
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
            options: silosData?.map(s => ({ value: s.id, label: s.name })) || []
          },
          {
            name: 'lot_supplier',
            label: 'Fornitore',
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome fornitore'
          }
        ]
      },
      {
        title: 'Dettagli Lotto',
        fields: [
          {
            name: 'lot_tf',
            label: 'Lotto TF',
            type: 'text',
            placeholder: 'Inserisci lotto TF'
          }
        ]
      },
      {
        title: 'Analisi Qualità',
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
            type: 'text',
            required: true,
            placeholder: 'Inserisci nome operatore'
          }
        ]
      }
    ],
    addButtonText: 'Registra Analisi',
    editButtonText: 'Aggiorna Analisi',
    addLoadingText: 'Registrando...',
    editLoadingText: 'Aggiornando...',
    addContext: 'Registrazione analisi',
    editContext: 'Aggiornamento analisi',
    addErrorMessage: 'Errore durante la registrazione dell\'analisi',
    editErrorMessage: 'Errore durante l\'aggiornamento dell\'analisi'
  };

  // Table columns
  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => `#${getValue()}`
    },
    {
      accessorKey: 'created_at',
      header: 'Data/Ora',
      cell: ({ getValue }) => formatDateTime(getValue())
    },
    {
      accessorKey: 'ddt_number',
      header: 'DDT'
    },
    {
      accessorKey: 'product',
      header: 'Prodotto'
    },
    {
      accessorKey: 'quantity_kg',
      header: 'Quantità (Kg)',
      cell: ({ getValue }) => `${getValue()} kg`
    },
    {
      accessorKey: 'silos.name',
      header: 'Silos',
      cell: ({ row }) => row.original.silos?.name || 'N/A'
    },
    {
      accessorKey: 'lot_supplier',
      header: 'Fornitore'
    },
    {
      accessorKey: 'lot_tf',
      header: 'Lotto TF',
      cell: ({ getValue }) => getValue() || 'N/A'
    },
    {
      accessorKey: 'cleaned',
      header: 'Pulizia',
      cell: ({ getValue }) => (getValue() ? 'Accettata' : 'Non Accettata')
    },
    {
      accessorKey: 'proteins',
      header: 'Proteine (%)',
      cell: ({ getValue }) => getValue() ? `${getValue()}%` : 'N/A'
    },
    {
      accessorKey: 'humidity',
      header: 'Umidità (%)',
      cell: ({ getValue }) => getValue() ? `${getValue()}%` : 'N/A'
    },
    {
      accessorKey: 'operator_name',
      header: 'Operatore',
      cell: ({ getValue }) => getValue() || 'N/A'
    }
  ];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Archivio Analisi</h1>
          <p className="text-gray-600 mt-1">
            Registra e gestisci tutti i valori di ogni analisi per migliorare la tracciabilità
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className=""
        >
          Registra Analisi
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingItem ? 'Modifica Analisi' : 'Nuova Analisi'}
            </h2>
          </div>
          <GenericForm
            config={formConfig}
            initialData={editingItem || {}}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            isEditMode={!!editingItem}
            isLoading={mutation.isPending}
          />
        </Card>
      )}

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Storico Analisi</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={archiveData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['product', 'silos.name', 'cleaned', 'operator_name', 'lot_supplier']}
            onBulkDelete={async (ids) => {
              if (!(await confirmDelete(`${ids.length} analisi selezionate`))) return false;
              bulkDelete.mutate(ids);
              return true;
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default ArchivePage;
