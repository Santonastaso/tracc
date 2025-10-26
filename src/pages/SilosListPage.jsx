import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { useMaterials, useDeleteSilo } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@santonastaso/shared';
import { SiloDetailCard } from '../components/SiloDetailCard';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { Link, useNavigate } from 'react-router-dom';

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

  const handleBulkExport = (ids) => {
    const selectedSilos = silosData?.filter(silo => ids.includes(silo.id)) || [];
    
    // Create CSV content
    const headers = ['ID', 'Nome Silos', 'Capacità (Kg)', 'Materiali Consentiti', 'Data Creazione', 'Ultima Modifica'];
    const csvContent = [
      headers.join(','),
      ...selectedSilos.map(silo => [
        silo.id,
        `"${silo.name}"`,
        silo.capacity_kg,
        `"${silo.allowed_material_ids?.length > 0 ? silo.allowed_material_ids.map(id => {
          const material = materialsData?.find(m => m.id === id);
          return material ? material.name : `ID: ${id}`;
        }).join(', ') : 'Tutti i materiali'}"`,
        new Date(silo.created_at).toLocaleDateString('it-IT', { timeZone: 'UTC' }),
        new Date(silo.updated_at).toLocaleDateString('it-IT', { timeZone: 'UTC' })
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `silos_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (item) => {
    setSelectedSilo(item);
  };

  const handleCloseDetail = () => {
    setSelectedSilo(null);
  };

  const handleEditRow = (item) => {
    navigate(`/silos/edit/${item.id}`);
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
    <div className="h-full flex flex-col p-2">
      <div className="flex justify-end items-center mb-2 flex-shrink-0">
        <Link to="/silos/new">
          <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300">
            Nuovo Silos
          </Button>
        </Link>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <DataTable
            data={silosData || []}
            columns={columns}
            onRowClick={handleRowClick}
            onEditRow={handleEditRow}
            enableFiltering={true}
            filterableColumns={['name']}
            enableGlobalSearch={false}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
            onBulkExport={handleBulkExport}
          />
        </div>
      </Card>

      {/* Detail Card */}
      {selectedSilo && (
        <SiloDetailCard
          silo={selectedSilo}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default SilosListPage;



