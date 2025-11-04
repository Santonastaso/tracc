import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteOperator } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ListPageLayout } from '@santonastaso/shared';
import { OperatorDetailCard } from '../components/OperatorDetailCard';
import { Badge } from '@santonastaso/shared';
import { useNavigate } from 'react-router-dom';

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

  const handleDeleteRow = (item) => {
    deleteMutation.mutate(item.id);
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
        <ListPageLayout
          title="Lista Operatori"
          entityName="Operator"
          createButtonHref="/operators/new"
      data={operatorsData || []}
      columns={columns}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      enableFiltering={true}
      filterableColumns={['name', 'code', 'role', 'status']}
      enableGlobalSearch={false}
      onBulkDelete={(ids) => bulkDelete.mutate(ids)}
      detailComponent={selectedOperator && (
        <OperatorDetailCard
          operator={selectedOperator}
          onClose={handleCloseDetail}
        />
      )}
    />
  );
}

export default OperatorsListPage;



