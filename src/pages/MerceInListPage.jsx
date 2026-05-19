import React, { useState } from 'react';
import {
  useMaterials,
  useOperators,
  useDeleteInbound,
  useInboundWithSilos,
  useBulkDeleteInbound,
} from '../hooks';
import { confirmDelete } from '../lib/confirm';
import { ListPageLayout, LoadingSkeleton } from '../ui';
import { formatDateTime } from '../lib/format';
import { MerceInDetailCard } from '../components/MerceInDetailCard';
import { useNavigate } from 'react-router-dom';

function MerceInListPage() {
  const navigate = useNavigate();
  const [_editingItem, _setEditingItem] = useState(null);
  const [selectedInbound, setSelectedInbound] = useState(null);

  // Fetch data using centralized query hooks
  const { data: inboundData, isLoading } = useInboundWithSilos();
  const { isLoading: materialsLoading } = useMaterials();
  const { isLoading: operatorsLoading } = useOperators();

  const deleteMutation = useDeleteInbound();
  const bulkDelete = useBulkDeleteInbound();

  const handleRowClick = (item) => {
    setSelectedInbound(item);
  };

  const handleCloseDetail = () => {
    setSelectedInbound(null);
  };

  const handleEditRow = (item) => {
    navigate(`/merce-in/edit/${item.id}`);
  };

  const handleDeleteRow = async (item) => {
    if (!(await confirmDelete('questo movimento IN'))) return;
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
      accessorKey: 'created_at',
      header: 'Data/Ora',
      cell: ({ getValue }) => formatDateTime(getValue())
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
    return <LoadingSkeleton />;
  }

  return (
        <ListPageLayout
          title="Lista Movimenti IN"
          entityName="Movement"
          createButtonHref="/merce-in/new"
      data={inboundData || []}
      columns={columns}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      enableFiltering={true}
      filterableColumns={['product', 'operator_name', 'lot_supplier']}
      enableGlobalSearch={false}
      onBulkDelete={async (ids) => {
        if (!(await confirmDelete(`${ids.length} movimenti selezionati`))) return false;
        bulkDelete.mutate(ids);
        return true;
      }}
      detailComponent={selectedInbound && (
        <MerceInDetailCard
          inbound={selectedInbound}
          onClose={handleCloseDetail}
        />
      )}
    />
  );
}

export default MerceInListPage;



