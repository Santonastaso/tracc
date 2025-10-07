import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeleteMaterial } from '../hooks';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link, useNavigate } from 'react-router-dom';

function MaterialsListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);

  // Fetch data using centralized query hooks
  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Use centralized mutation hooks
  const deleteMutation = useDeleteMaterial();
  const queryClient = useQueryClient();

  // Bulk delete using Supabase
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['materials'])
  });

  const handleEdit = (item) => {
    navigate(`/materials/edit/${item.id}`);
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo materiale?')) {
      deleteMutation.mutate(item.id);
    }
  };

  // Table columns
  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => `#${getValue()}`
    },
    {
      accessorKey: 'name',
      header: 'Nome Materiale'
    },
    {
      accessorKey: 'description',
      header: 'Descrizione',
      cell: ({ getValue }) => {
        const description = getValue();
        return description ? (description.length > 50 ? `${description.substring(0, 50)}...` : description) : 'N/A';
      }
    },
    {
      accessorKey: 'unit',
      header: 'Unità'
    },
    {
      accessorKey: 'min_quantity',
      header: 'Quantità Min',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? `${value}` : 'N/A';
      }
    },
    {
      accessorKey: 'max_quantity',
      header: 'Quantità Max',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? `${value}` : 'N/A';
      }
    },
    {
      accessorKey: 'notes',
      header: 'Note',
      cell: ({ getValue }) => {
        const notes = getValue();
        return notes ? (notes.length > 30 ? `${notes.substring(0, 30)}...` : notes) : 'N/A';
      }
    },
    {
      accessorKey: 'active',
      header: 'Attivo',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          getValue() ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
        }`}>
          {getValue() ? 'Sì' : 'No'}
        </span>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Data Creazione',
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return date.toLocaleDateString('it-IT', { timeZone: 'UTC' });
      }
    },
    {
      accessorKey: 'updated_at',
      header: 'Ultima Modifica',
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return date.toLocaleDateString('it-IT', { timeZone: 'UTC' });
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Lista Materiali</h1>
        <div className="flex space-x-2">
          <Link to="/materials/new">
            <Button>
              Nuovo Materiale
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Materiali</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={materialsData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['name', 'unit']}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>
    </div>
  );
}

export default MaterialsListPage;



