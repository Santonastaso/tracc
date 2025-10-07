import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteOperator } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';

function OperatorsListPage() {
  const navigate = useNavigate();
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

  // Use centralized mutation hooks
  const deleteMutation = useDeleteOperator();
  const queryClient = useQueryClient();
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('operators')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['operators'])
  });

  const handleEdit = (item) => {
    navigate(`/operators/edit/${item.id}`);
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo operatore?')) {
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
        const statusVariant = status === 'active' ? 'default' : status === 'inactive' ? 'destructive' : status === 'suspended' ? 'secondary' : 'outline';
        return (
          <Badge variant={statusVariant}>
            {status || 'N/A'}
          </Badge>
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
        <h1 className="text-2xl font-bold text-foreground">Operatori</h1>
        <div className="flex space-x-2">
          <Link to="/operators/new">
            <Button>
              Nuovo Operatore
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <DataTable
            data={operatorsData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['name', 'code', 'role', 'status']}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>
    </div>
  );
}

export default OperatorsListPage;



