import React, { useState } from 'react';
import { useDataService, DataTable } from '@andrea/crm-data';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@andrea/crm-ui';
import { ModernSilosService } from '../services/ModernSilosService';
import { showSuccess, showError } from '@andrea/shared-utils';

// Create service instance
const silosService = new ModernSilosService();

function ModernSilosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Use the new data service hooks
  const dataService = useDataService(silosService, 'silos');
  
  // Get paginated data
  const { data: paginatedData, isLoading, error } = dataService.useGetPaginated({
    page: pagination.current,
    perPage: pagination.pageSize,
    filters: searchTerm ? { name: `%${searchTerm}%` } : {}
  });

  // Mutations
  const deleteMutation = dataService.useDelete();
  const bulkDeleteMutation = dataService.useBulkDelete();

  // Define columns for the professional DataTable
  const columns = [
    {
      key: 'name',
      title: 'Silo Name',
      dataIndex: 'name',
      sortable: true,
      render: (value, record) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      key: 'material_type',
      title: 'Material Type',
      dataIndex: 'material_type',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">{value || 'N/A'}</Badge>
      )
    },
    {
      key: 'capacity',
      title: 'Capacity',
      dataIndex: 'capacity',
      sortable: true,
      align: 'right',
      render: (value) => `${value?.toLocaleString() || 0} tons`
    },
    {
      key: 'current_level',
      title: 'Current Level',
      dataIndex: 'current_level',
      sortable: true,
      align: 'right',
      render: (value) => {
        const percentage = Math.round((value || 0) * 100);
        const variant = percentage < 20 ? 'destructive' : percentage < 50 ? 'secondary' : 'default';
        return <Badge variant={variant}>{percentage}%</Badge>;
      }
    },
    {
      key: 'location',
      title: 'Location',
      dataIndex: 'location',
      sortable: true
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  // Handle actions
  const handleEdit = (record) => {
    console.log('Edit silo:', record);
    // Navigate to edit page or open modal
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSuccess('Silo deleted successfully');
    } catch (error) {
      showError(`Failed to delete silo: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    try {
      await bulkDeleteMutation.mutateAsync(selectedRows);
      showSuccess(`${selectedRows.length} silos deleted successfully`);
      setSelectedRows([]);
    } catch (error) {
      showError(`Failed to delete silos: ${error.message}`);
    }
  };

  const handleRowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys, selectedRowsData) => {
      setSelectedRows(selectedRowKeys);
    }
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive">Error loading silos: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Modern Silos Management</h1>
          <p className="text-muted-foreground">
            Powered by @andrea/crm-data - Professional data handling patterns
          </p>
        </div>
        <Button onClick={() => console.log('Add new silo')}>
          Add New Silo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Silos Overview</CardTitle>
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search silos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            {selectedRows.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                Delete Selected ({selectedRows.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={paginatedData?.data || []}
            columns={columns}
            loading={isLoading}
            rowSelection={handleRowSelection}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: paginatedData?.total || 0,
              onChange: handlePaginationChange
            }}
            onRowClick={(record) => console.log('Row clicked:', record)}
            emptyText="No silos found"
          />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Silos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paginatedData?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedRows.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Current Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagination.current} of {paginatedData?.totalPages || 1}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ModernSilosPage;
