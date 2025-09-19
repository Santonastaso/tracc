import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link } from 'react-router-dom';

function MaterialsListPage() {
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

  const handleEdit = (item) => {
    // Navigate to the edit page with the item data
    window.location.href = `/materials/edit/${item.id}`;
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo materiale?')) {
      // TODO: Implement delete functionality
      console.log('Delete material:', item.id);
    }
  };

  // Table columns
  const columns = [
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
      accessorKey: 'active',
      header: 'Attivo',
      cell: ({ getValue }) => getValue() ? 'Sì' : 'No'
    },
    {
      accessorKey: 'created_at',
      header: 'Data Creazione',
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return date.toLocaleDateString('it-IT');
      }
    }
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Lista Materiali</h1>
        <div className="flex space-x-2">
          <Link to="/materials/new">
            <Button className="bg-navy-800 hover:bg-navy-700">
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
          />
        </div>
      </Card>
    </div>
  );
}

export default MaterialsListPage;
