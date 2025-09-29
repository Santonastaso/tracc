import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteSupplier } from '../hooks';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link, useNavigate } from 'react-router-dom';

function SuppliersListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);

  // Fetch data using centralized query hooks
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Use centralized mutation hooks
  const deleteMutation = useDeleteSupplier();
  const queryClient = useQueryClient();
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['suppliers'])
  });

  const handleEdit = (item) => {
    navigate(`/suppliers/edit/${item.id}`);
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo fornitore?')) {
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
      header: 'Nome Fornitore'
    },
    {
      accessorKey: 'code',
      header: 'Codice'
    },
    {
      accessorKey: 'contact_person',
      header: 'Persona di Contatto'
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
      accessorKey: 'address',
      header: 'Indirizzo',
      cell: ({ getValue }) => {
        const address = getValue();
        return address ? (address.length > 30 ? `${address.substring(0, 30)}...` : address) : 'N/A';
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
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Lista Fornitori</h1>
        <div className="flex space-x-2">
          <Link to="/suppliers/new">
            <Button className="bg-navy-800 hover:bg-navy-700">
              Nuovo Fornitore
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Fornitori</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={suppliersData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['name', 'code', 'contact_person', 'status']}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
            enableGlobalSearch={true}
            enableColumnVisibility={true}
          />
        </div>
      </Card>
    </div>
  );
}

export default SuppliersListPage;

