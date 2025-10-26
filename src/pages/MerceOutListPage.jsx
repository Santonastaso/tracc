import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useDeleteOutbound,
  queryKeys
} from '../hooks';
import { DataTable } from '@santonastaso/shared';
import { MerceOutDetailCard } from '../components/MerceOutDetailCard';
import { Button } from '@santonastaso/shared';
import { Card } from '@santonastaso/shared';
import { Link, useNavigate } from 'react-router-dom';

function MerceOutListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [selectedOutbound, setSelectedOutbound] = useState(null);

  // Fetch data using centralized query hooks
  const { data: outboundData, isLoading } = useQuery({
    queryKey: [...queryKeys.outbound, 'with-silos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Use centralized mutation hooks
  const deleteMutation = useDeleteOutbound();
  const queryClient = useQueryClient();
  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('outbound')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries([...queryKeys.outbound, 'with-silos'])
  });

  const handleRowClick = (item) => {
    setSelectedOutbound(item);
  };

  const handleCloseDetail = () => {
    setSelectedOutbound(null);
  };

  const handleEditRow = (item) => {
    navigate(`/merce-out/edit/${item.id}`);
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
      accessorKey: 'silos.name',
      header: 'Silos'
    },
    {
      accessorKey: 'quantity_kg',
      header: 'Quantità (Kg)',
      cell: ({ getValue }) => `${getValue()} kg`
    },
    {
      accessorKey: 'operator_name',
      header: 'Operatore'
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
        <Link to="/merce-out/new">
          <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300">
            Nuovo Prelievo
          </Button>
        </Link>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <DataTable
            data={outboundData || []}
            columns={columns}
            onRowClick={handleRowClick}
            onEditRow={handleEditRow}
            enableFiltering={true}
            filterableColumns={['silos.name', 'operator_name']}
            enableGlobalSearch={false}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>

      {/* Detail Card */}
      {selectedOutbound && (
        <MerceOutDetailCard
          outbound={selectedOutbound}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default MerceOutListPage;



