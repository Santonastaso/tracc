import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useMaterials, useDeleteSilo } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ListPageLayout } from '@santonastaso/shared';
import { SiloDetailCard } from '../components/SiloDetailCard';
import { useNavigate } from 'react-router-dom';

function SilosListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedSilo, setSelectedSilo] = useState(null);

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

  const { data: materialsData, isLoading: materialsLoading } = useMaterials();

  // Use centralized mutation hooks
  const deleteMutation = useDeleteSilo();
  const queryClient = useQueryClient();
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('silos')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['silos'])
  });

  const handleRowClick = (item) => {
    setSelectedSilo(item);
  };

  const handleCloseDetail = () => {
    setSelectedSilo(null);
  };

  const handleEditRow = (item) => {
    navigate(`/silos/edit/${item.id}`);
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
      header: 'Nome Silos'
    },
    {
      accessorKey: 'capacity_kg',
      header: 'Capacità (Kg)',
      cell: ({ getValue }) => `${getValue().toLocaleString()} kg`
    }
  ];

  if (isLoading || materialsLoading) {
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
          title="Lista Silos"
          entityName="Silo"
          createButtonHref="/silos/new"
      data={silosData || []}
      columns={columns}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      enableFiltering={true}
      filterableColumns={['name']}
      enableGlobalSearch={false}
      onBulkDelete={(ids) => bulkDelete.mutate(ids)}
      detailComponent={selectedSilo && (
        <SiloDetailCard
          silo={selectedSilo}
          onClose={handleCloseDetail}
        />
      )}
    />
  );
}

export default SilosListPage;



