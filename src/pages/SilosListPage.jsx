import React, { useState } from 'react';
import { useDeleteSilo, useSilosList, useBulkDeleteSilos } from '../hooks';
import { confirmDelete } from '../lib/confirm';
import { ListPageLayout } from '../ui';
import { SiloDetailCard } from '../components/SiloDetailCard';
import { useNavigate } from 'react-router-dom';

function SilosListPage() {
  const navigate = useNavigate();
  const [selectedSilo, setSelectedSilo] = useState(null);

  const { data: silosData, isLoading } = useSilosList();
  const deleteMutation = useDeleteSilo();
  const bulkDelete = useBulkDeleteSilos();

  const handleRowClick = (item) => {
    setSelectedSilo(item);
  };

  const handleCloseDetail = () => {
    setSelectedSilo(null);
  };

  const handleEditRow = (item) => {
    navigate(`/silos/edit/${item.id}`);
  };

  const handleDeleteRow = async (item) => {
    if (!(await confirmDelete(`il silo "${item.name}"`))) return;
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
      header: 'Nome Silo',
    },
    {
      accessorKey: 'capacity_kg',
      header: 'Capacità (kg)',
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
      title="Lista Silos"
      entityName="Silo"
      createButtonHref="/silos/new"
      data={silosData || []}
      columns={columns}
      loading={isLoading}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      onBulkDelete={async (ids) => {
        if (!(await confirmDelete(`${ids.length} silos selezionati`))) return false;
        bulkDelete.mutate(ids);
        return true;
      }}
      detailComponent={
        selectedSilo && (
          <SiloDetailCard silo={selectedSilo} onClose={handleCloseDetail} onEdit={handleEditRow} />
        )
      }
    />
  );
}

export default SilosListPage;
