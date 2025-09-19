import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link } from 'react-router-dom';

function OperatorsListPage() {
  const [editingItem, setEditingItem] = useState(null);

  // Fetch data using centralized query hooks
  const { data: operatorsData, isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleEdit = (item) => {
    // Navigate to the edit page with the item data
    window.location.href = `/operators/edit/${item.id}`;
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo operatore?')) {
      // TODO: Implement delete functionality
      console.log('Delete operator:', item.id);
    }
  };

  // Table columns
  const columns = [
    {
      accessorKey: 'name',
      header: 'Nome'
    },
    {
      accessorKey: 'code',
      header: 'Codice'
    },
    {
      accessorKey: 'role',
      header: 'Ruolo'
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ getValue }) => {
        const status = getValue();
        const statusColors = {
          'active': 'text-green-600 bg-green-100',
          'inactive': 'text-red-600 bg-red-100',
          'suspended': 'text-yellow-600 bg-yellow-100'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'text-gray-600 bg-gray-100'}`}>
            {status || 'N/A'}
          </span>
        );
      }
    },
    {
      accessorKey: 'phone',
      header: 'Telefono'
    },
    {
      accessorKey: 'email',
      header: 'Email'
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
        <h1 className="text-2xl font-bold text-gray-900">Lista Operatori</h1>
        <div className="flex space-x-2">
          <Link to="/operators/new">
            <Button className="bg-navy-800 hover:bg-navy-700">
              Nuovo Operatore
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Operatori</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={operatorsData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['name', 'code', 'role', 'status']}
          />
        </div>
      </Card>
    </div>
  );
}

export default OperatorsListPage;
