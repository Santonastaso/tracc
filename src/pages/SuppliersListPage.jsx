import React, { useState } from 'react';
import { useDeleteSupplier, useSuppliers, useBulkDeleteSuppliers } from '../hooks';
import { confirmDelete } from '../lib/confirm';
import { ListPageLayout } from '../ui';
import { SupplierDetailCard } from '../components/SupplierDetailCard';
import { Badge } from '../ui';
import { useNavigate } from 'react-router-dom';

function SuppliersListPage() {
  const navigate = useNavigate();
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const { data: suppliersData, isLoading } = useSuppliers();
  const deleteMutation = useDeleteSupplier();
  const bulkDelete = useBulkDeleteSuppliers();

  const handleRowClick = (item) => {
    setSelectedSupplier(item);
  };

  const handleCloseDetail = () => {
    setSelectedSupplier(null);
  };

  const handleEditRow = (item) => {
    navigate(`/suppliers/edit/${item.id}`);
  };

  const handleDeleteRow = async (item) => {
    if (!(await confirmDelete(`il fornitore "${item.name}"`))) return;
    deleteMutation.mutate(item.id);
  };

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => `#${getValue()}`,
    },
    {
      accessorKey: 'name',
      header: 'Nome Fornitore',
    },
    {
      accessorKey: 'code',
      header: 'Codice',
    },
    {
      accessorKey: 'active',
      header: 'Attivo',
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? 'default' : 'secondary'}>{getValue() ? 'Sì' : 'No'}</Badge>
      ),
    },
  ];

  return (
    <ListPageLayout
      title="Lista Fornitori"
      entityName="Supplier"
      createButtonHref="/suppliers/new"
      data={suppliersData || []}
      columns={columns}
      loading={isLoading}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      onBulkDelete={async (ids) => {
        if (!(await confirmDelete(`${ids.length} fornitori selezionati`))) return false;
        bulkDelete.mutate(ids);
        return true;
      }}
      detailComponent={
        selectedSupplier && (
          <SupplierDetailCard
            supplier={selectedSupplier}
            onClose={handleCloseDetail}
            onEdit={handleEditRow}
          />
        )
      }
    />
  );
}

export default SuppliersListPage;
