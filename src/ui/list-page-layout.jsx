import React from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from './data-table';
import { Button } from './button';

export function ListPageLayout({
  title,
  createButtonText,
  createButtonHref,
  entityName,
  data,
  columns,
  onRowClick,
  onEditRow,
  onDeleteRow,
  enableFiltering = true,
  filterableColumns = [],
  enableGlobalSearch = false,
  onBulkDelete,
  onBulkExport,
  loading = false,
  emptyMessage,
  detailComponent,
  className,
}) {
  const standardizedButtonText = createButtonText || `+ New ${entityName || 'Item'}`;

  return (
    <div className={`space-y-1 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <Link to={createButtonHref}>
          <Button variant="outline">{standardizedButtonText}</Button>
        </Link>
      </div>

      <DataTable
        data={data}
        columns={columns}
        onRowClick={onRowClick}
        onEditRow={onEditRow}
        onDeleteRow={onDeleteRow}
        enableFiltering={enableFiltering}
        filterableColumns={filterableColumns}
        enableGlobalSearch={enableGlobalSearch}
        onBulkDelete={onBulkDelete}
        onBulkExport={onBulkExport}
        loading={loading}
        emptyMessage={emptyMessage}
      />

      {detailComponent}
    </div>
  );
}
