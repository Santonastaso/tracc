import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useMaterials, 
  useOperators,
  useDeleteInbound,
  queryKeys
} from '../hooks';
import DataTable from '../components/DataTable';
import { MerceInDetailCard } from '../components/MerceInDetailCard';
import { Button } from '@santonastaso/crm-ui';
import { Card } from '@santonastaso/crm-ui';
import { Link, useNavigate } from 'react-router-dom';

function MerceInListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedInbound, setSelectedInbound] = useState(null);

  // Fetch data using centralized query hooks
  const { data: inboundData, isLoading } = useQuery({
    queryKey: [...queryKeys.inbound, 'with-silos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select('*, silos(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: materialsData, isLoading: materialsLoading } = useMaterials();
  const { data: operatorsData, isLoading: operatorsLoading } = useOperators();

  // Use centralized mutation hooks
  const deleteMutation = useDeleteInbound();
  const queryClient = useQueryClient();
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('inbound')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries([...queryKeys.inbound, 'with-silos'])
  });

  const handleRowClick = (item) => {
    setSelectedInbound(item);
  };

  const handleCloseDetail = () => {
    setSelectedInbound(null);
  };

  const handleEditRow = (item) => {
    navigate(`/merce-in/edit/${item.id}`);
  };

  // Table columns - only essential info
  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => `#${getValue()}`
    },
    {
      accessorKey: 'created_at',
      header: 'Data/Ora',
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return date.toLocaleString('it-IT', { 
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    {
      accessorKey: 'product',
      header: 'Prodotto'
    },
    {
      accessorKey: 'quantity_kg',
      header: 'Quantità (Kg)',
      cell: ({ getValue }) => `${getValue()} kg`
    },
    {
      accessorKey: 'silos.name',
      header: 'Silos',
      cell: ({ row }) => row.original.silos?.name || 'N/A'
    },
    {
      accessorKey: 'operator_name',
      header: 'Operatore'
    },
    {
      accessorKey: 'lot_supplier',
      header: 'Fornitore'
    }
  ];

  if (isLoading || materialsLoading || operatorsLoading) {
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
        <Link to="/merce-in/new">
          <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300">
            Nuovo Movimento
          </Button>
        </Link>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <DataTable
            data={inboundData || []}
            columns={columns}
            onRowClick={handleRowClick}
            onEditRow={handleEditRow}
            enableFiltering={true}
            filterableColumns={['product', 'operator_name']}
            enableGlobalSearch={false}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>

      {/* Detail Card */}
      {selectedInbound && (
        <MerceInDetailCard
          inbound={selectedInbound}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default MerceInListPage;



