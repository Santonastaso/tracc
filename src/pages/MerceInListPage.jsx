import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';
import { 
  useMaterials, 
  useOperators,
  useDeleteInbound,
  queryKeys
} from '../hooks';
import DataTable from '../components/DataTable';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link } from 'react-router-dom';

function MerceInListPage() {
  const [editingItem, setEditingItem] = useState(null);

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

  const handleEdit = (item) => {
    // Navigate to the edit page with the item data
    // This will be handled by routing to the form page
    window.location.href = `/merce-in/edit/${item.id}`;
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
      accessorKey: 'ddt_number',
      header: 'DDT'
    },
    {
      accessorKey: 'product',
      header: 'Prodotto',
      cell: ({ getValue, row }) => {
        const product = getValue();
        // Try to find the material to show unit
        const material = materialsData?.find(m => m.name === product);
        return material ? `${product} (${material.unit || 'Kg'})` : product;
      }
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
      accessorKey: 'lot_supplier',
      header: 'Lotto Fornitore'
    },
    {
      accessorKey: 'lot_tf',
      header: 'Lotto TF'
    },
    {
      accessorKey: 'cleaned',
      header: 'Pulizia',
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          getValue() ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
        }`}>
          {getValue() ? 'Accettata' : 'Non Accettata'}
        </span>
      )
    },
    {
      accessorKey: 'proteins',
      header: 'Proteine (%)',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? `${value}%` : 'N/A';
      }
    },
    {
      accessorKey: 'humidity',
      header: 'Umidità (%)',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? `${value}%` : 'N/A';
      }
    },
    {
      accessorKey: 'operator_name',
      header: 'Operatore'
    },
    {
      accessorKey: 'updated_at',
      header: 'Ultima Modifica',
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return date.toLocaleDateString('it-IT');
      }
    }
  ];

  if (isLoading || materialsLoading || operatorsLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Lista Movimenti Merce IN</h1>
        <div className="flex space-x-2">
          <Link to="/merce-in/new">
            <Button className="bg-navy-800 hover:bg-navy-700">
              Nuovo Movimento
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Movimenti Merce IN</h2>
        <div className="flex-1 min-h-0">
          <DataTable
            data={inboundData || []}
            columns={columns}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            enableFiltering={true}
            filterableColumns={['product', 'operator_name']}
          />
        </div>
      </Card>
    </div>
  );
}

export default MerceInListPage;

