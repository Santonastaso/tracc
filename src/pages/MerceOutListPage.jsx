import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useDeleteOutbound,
  queryKeys
} from '../hooks';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link, useNavigate } from 'react-router-dom';

function MerceOutListPage() {
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);

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

  const handleEdit = (item) => {
    navigate(`/merce-out/edit/${item.id}`);
  };

  const handleDelete = (item) => {
    if (window.confirm('Sei sicuro di voler eliminare questo movimento?')) {
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
      header: 'Dettagli Prelievo',
      cell: ({ getValue }) => {
        const items = getValue();
        if (!items || items.length === 0) return 'N/A';
        
        return (
          <div className="text-xs max-w-xs">
            {items.map((item, index) => (
              <div key={index} className="mb-1 p-1 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">{item.material_name}</div>
                <div className="text-gray-600">
                  {item.quantity_kg}kg
                  {item.supplier_lot && ` • Lotto: ${item.supplier_lot}`}
                  {item.tf_lot && ` • TF: ${item.tf_lot}`}
                </div>
                {(item.protein_content || item.moisture_content) && (
                  <div className="text-gray-500 text-xs">
                    {item.protein_content && `Proteine: ${item.protein_content}%`}
                    {item.protein_content && item.moisture_content && ' • '}
                    {item.moisture_content && `Umidità: ${item.moisture_content}%`}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
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
        <h1 className="text-2xl font-bold text-foreground">Lista Movimenti Merce OUT</h1>
        <div className="flex space-x-2">
          <Link to="/merce-out/new">
            <Button>
              Nuovo Prelievo
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Prelievi Merce OUT</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={outboundData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['silos.name', 'operator_name']}
            onBulkDelete={(ids) => bulkDelete.mutate(ids)}
          />
        </div>
      </Card>
    </div>
  );
}

export default MerceOutListPage;



