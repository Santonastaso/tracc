import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteOperator } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@santonastaso/shared';
import { OperatorDetailCard } from '../components/OperatorDetailCard';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { Badge } from '@santonastaso/shared';
import { Link, useNavigate } from 'react-router-dom';

function OperatorsListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);

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

  const handleRowClick = (item) => {
    setSelectedOperator(item);
  };

  const handleCloseDetail = () => {
    setSelectedOperator(null);
  };

  const handleEditRow = (item) => {
    navigate(`/operators/edit/${item.id}`);
  };

  // Table columns - only essential info
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
    }
  ];

  if (isLoading) {
    return (
      <div className="p-2">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex justify-end items-center mb-2 flex-shrink-0">
        <Link to="/operators/new">
          <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300">
            Nuovo Operatore
          </Button>
        </Link>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <DataTable
            data={operatorsData || []}
            columns={columns}
            onRowClick={handleRowClick}
            onEditRow={handleEditRow}
            enableFiltering={true}
            filterableColumns={['name', 'code', 'role', 'status']}
            enableGlobalSearch={false}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>

      {/* Detail Card */}
      {selectedOperator && (
        <OperatorDetailCard
          operator={selectedOperator}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default OperatorsListPage;



