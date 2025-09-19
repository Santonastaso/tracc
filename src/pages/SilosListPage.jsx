import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link } from 'react-router-dom';

function SilosListPage() {
  const [editingItem, setEditingItem] = useState(null);

  // Fetch data using centralized query hooks
  const { data: silosData, isLoading } = useQuery({
    queryKey: ['silos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('silos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleEdit = (item) => {
    // Navigate to the edit page with the item data
    window.location.href = `/silos/edit/${item.id}`;
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo silos?')) {
      // TODO: Implement delete functionality
      console.log('Delete silo:', item.id);
    }
  };

  // Table columns
  const columns = [
    {
      accessorKey: 'name',
      header: 'Nome Silos'
    },
    {
      accessorKey: 'capacity_kg',
      header: 'Capacità (Kg)',
      cell: ({ getValue }) => `${getValue().toLocaleString()} kg`
    },
    {
      accessorKey: 'allowed_material_ids',
      header: 'Materiali Consentiti',
      cell: ({ getValue }) => {
        const materialIds = getValue();
        if (!materialIds || materialIds.length === 0) {
          return 'Tutti';
        }
        return `${materialIds.length} materiali specifici`;
      }
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
        <h1 className="text-2xl font-bold text-gray-900">Lista Silos</h1>
        <div className="flex space-x-2">
          <Link to="/silos/new">
            <Button className="bg-navy-800 hover:bg-navy-700">
              Nuovo Silos
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Silos</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={silosData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['name']}
          />
        </div>
      </Card>
    </div>
  );
}

export default SilosListPage;
