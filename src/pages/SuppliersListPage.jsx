import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useDeleteSupplier } from '../hooks';
import { ListPageLayout } from '@santonastaso/shared';
import { SupplierDetailCard } from '../components/SupplierDetailCard';
import { Badge } from '@santonastaso/shared';
import { useNavigate } from 'react-router-dom';

function SuppliersListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

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

  const handleRowClick = (item) => {
    setSelectedSupplier(item);
  };

  const handleCloseDetail = () => {
    setSelectedSupplier(null);
  };

  const handleEditRow = (item) => {
    navigate(`/suppliers/edit/${item.id}`);
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
          title="Lista Fornitori"
          entityName="Supplier"
          createButtonHref="/suppliers/new"
      data={suppliersData || []}
      columns={columns}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      enableFiltering={true}
      filterableColumns={['name', 'code', 'contact_person', 'status']}
      onBulkDelete={(ids) => bulkDelete.mutate(ids)}
      enableGlobalSearch={false}
      detailComponent={selectedSupplier && (
        <SupplierDetailCard
          supplier={selectedSupplier}
          onClose={handleCloseDetail}
        />
      )}
    />
  );
}

export default SuppliersListPage;



