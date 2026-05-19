import React, { useState } from 'react';
import {
  useDeleteOperator,
  useOperatorsList,
  useBulkDeleteOperators,
} from '../hooks';
import { confirmDelete } from '../lib/confirm';
import { ListPageLayout } from '../ui';
import { OperatorDetailCard } from '../components/OperatorDetailCard';
import { Badge } from '../ui';
import { useNavigate } from 'react-router-dom';

function OperatorsListPage() {
  const navigate = useNavigate();
  const [selectedOperator, setSelectedOperator] = useState(null);

  const { data: operatorsData, isLoading } = useOperatorsList();
  const deleteMutation = useDeleteOperator();
  const bulkDelete = useBulkDeleteOperators();

  const handleRowClick = (item) => {
    setSelectedOperator(item);
  };

  const handleCloseDetail = () => {
    setSelectedOperator(null);
  };

  const handleEditRow = (item) => {
    navigate(`/operators/edit/${item.id}`);
  };

  const handleDeleteRow = async (item) => {
    if (!(await confirmDelete(`l'operatore "${item.name}"`))) return;
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
      header: 'Nome',
    },
    {
      accessorKey: 'code',
      header: 'Codice',
    },
    {
      accessorKey: 'role',
      header: 'Ruolo',
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'active' ? 'default' : 'secondary'}>
          {getValue() === 'active' ? 'Attivo' : 'Inattivo'}
        </Badge>
      ),
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
      title="Lista Operatori"
      entityName="Operator"
      createButtonHref="/operators/new"
      data={operatorsData || []}
      columns={columns}
      loading={isLoading}
      onRowClick={handleRowClick}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      onBulkDelete={async (ids) => {
        if (!(await confirmDelete(`${ids.length} operatori selezionati`))) return false;
        bulkDelete.mutate(ids);
        return true;
      }}
      detailComponent={
        selectedOperator && (
          <OperatorDetailCard
            operator={selectedOperator}
            onClose={handleCloseDetail}
            onEdit={handleEditRow}
          />
        )
      }
    />
  );
}

export default OperatorsListPage;
