import React, { useState } from 'react';
import { useDeleteMaterial, useMaterialsList, useBulkDeleteMaterials } from '../hooks';
import { confirmDelete } from '../lib/confirm';
import { ListPageLayout } from '../ui';
import { MaterialDetailCard } from '../components/MaterialDetailCard';
import { useNavigate } from 'react-router-dom';

function MaterialsListPage() {
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const { data: materialsData, isLoading } = useMaterialsList();
  const deleteMutation = useDeleteMaterial();
  const bulkDelete = useBulkDeleteMaterials();

  const handleRowClick = (item) => {
    setSelectedMaterial(item);
  };

  const handleCloseDetail = () => {
    setSelectedMaterial(null);
  };

  const handleEditRow = (item) => {
    navigate(`/materials/edit/${item.id}`);
  };

  const handleDeleteRow = async (item) => {
    if (!(await confirmDelete(`il materiale "${item.name}"`))) return;
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
      header: 'Nome Materiale',
    },
    {
      accessorKey: 'unit',
      header: 'Unità',
    },
    {
      accessorKey: 'active',
      header: 'Attivo',
      cell: ({ getValue }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {getValue() ? 'Sì' : 'No'}
        </span>
      ),
    },
  ];

  return (
    <ListPageLayout
      title="Lista Materiali"
      entityName="Material"
      createButtonHref="/materials/new"
      data={materialsData || []}
      columns={columns}
      loading={isLoading}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      onBulkDelete={async (ids) => {
        if (!(await confirmDelete(`${ids.length} materiali selezionati`))) return false;
        bulkDelete.mutate(ids);
        return true;
      }}
      detailComponent={
        selectedMaterial && (
          <MaterialDetailCard
            material={selectedMaterial}
            onClose={handleCloseDetail}
            onEdit={handleEditRow}
          />
        )
      }
    />
  );
}

export default MaterialsListPage;
