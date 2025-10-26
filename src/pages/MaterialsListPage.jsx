import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeleteMaterial } from '../hooks';
import { DataTable } from '@santonastaso/shared';
import { MaterialDetailCard } from '../components/MaterialDetailCard';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { Link, useNavigate } from 'react-router-dom';

function MaterialsListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

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

  const handleRowClick = (item) => {
    setSelectedMaterial(item);
  };

  const handleCloseDetail = () => {
    setSelectedMaterial(null);
  };

  const handleEditRow = (item) => {
    navigate(`/materials/edit/${item.id}`);
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
      header: 'Nome Materiale'
    },
    {
      accessorKey: 'unit',
      header: 'Unità'
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
        <Link to="/materials/new">
          <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300">
            Nuovo Materiale
          </Button>
        </Link>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <DataTable
            data={materialsData || []}
            columns={columns}
            onRowClick={handleRowClick}
            onEditRow={handleEditRow}
            enableFiltering={true}
            filterableColumns={['name', 'unit']}
            enableGlobalSearch={false}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>

      {/* Detail Card */}
      {selectedMaterial && (
        <MaterialDetailCard
          material={selectedMaterial}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default MaterialsListPage;



