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
    },
    {
      accessorKey: 'items',
      header: 'Lotti',
      cell: ({ getValue }) => {
        const items = getValue();
        if (!items || items.length === 0) {
          return <span className="text-muted-foreground">N/A</span>;
        }
        
        if (items.length === 1) {
          const item = items[0];
          return (
            <div className="text-sm">
              <div className="font-medium">{item.material_name}</div>
              <div className="text-muted-foreground">
                {item.supplier_lot || item.tf_lot || 'Senza lotto'}
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-sm">
            <div className="font-medium">{items.length} lotti</div>
            <div className="text-muted-foreground">
              {items.map(item => item.material_name).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
            </div>
          </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Lista Movimenti OUT</h1>
        <Link to="/merce-out/new">
          <Button variant="outline">
            Nuovo Prelievo
          </Button>
        </Link>
      </div>
      
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



