import React, { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender, getSortedRowModel } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { BulkActionsToolbar } from './ui/BulkActionsToolbar';
import FilterDropdown from './FilterDropdown';
import { confirmAction } from '../utils';

function DataTable({ 
  data, 
  columns, 
  onEditRow, 
  onDeleteRow, 
  onRowClick,
  enableFiltering = false, 
  filterableColumns = [], 
  stickyColumns = [],
  onBulkDelete = null,
  onBulkExport = null,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  enableGlobalSearch = true,
  enableColumnVisibility = false
}) {
  // Filter state management
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [globalQuery, setGlobalQuery] = useState('');

  // Helper to get nested values via dot notation
  const getNested = (obj, path) => {
    if (!obj || !path) return undefined;
    if (path.indexOf('.') === -1) return obj[path];
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  };

  // Apply column filters
  const filteredData = useMemo(() => {
    if (!enableFiltering || Object.keys(filters).length === 0) return data;
    
    return data.filter(item => {
      return Object.entries(filters).every(([column, filterValue]) => {
        if (!filterValue) return true;
        
        const itemValue = getNested(item, column);
        if (!itemValue) return false;
        
        // Handle array of selected values (multi-selection)
        if (Array.isArray(filterValue)) {
          return filterValue.includes(itemValue);
        }
        
        // Handle single value (legacy support)
        return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, filters, enableFiltering]);

  // Get unique values for each filterable column
  const filterOptions = useMemo(() => {
    if (!enableFiltering) return {};
    
    const options = {};
    filterableColumns.forEach(column => {
      options[column] = [...new Set(data.map(item => getNested(item, column)).filter(Boolean))].sort();
    });
    return options;
  }, [data, filterableColumns, enableFiltering]);

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const toggleFilter = (column) => {
    setOpenFilter(openFilter === column ? null : column);
  };

  // Calculate table data first to avoid circular dependency
  const tableData = useMemo(() => {
    // Check for duplicate IDs
    if (filteredData && filteredData.length > 0) {
      const ids = filteredData.map(item => item.id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        // Duplicate IDs detected but not logged
      }
      
      // Check for duplicate objects (same ID, same data)
      const seenIds = new Set();
      const duplicates = [];
      filteredData.forEach((item, index) => {
        if (seenIds.has(item.id)) {
          duplicates.push({ id: item.id, index, item });
        } else {
          seenIds.add(item.id);
        }
      });
      
      if (duplicates.length > 0) {
        // Duplicate objects detected but not logged
      }
    }
    // Global search across defined accessor keys (supports nested paths)
    if (enableGlobalSearch && globalQuery.trim().length > 0) {
      const q = globalQuery.toLowerCase();
      const searchableKeys = (columns || []).map(c => c.accessorKey).filter(Boolean);
      const globallyFiltered = filteredData.filter(item => (
        searchableKeys.some(k => {
          const v = getNested(item, k);
          return v !== undefined && v !== null && String(v).toLowerCase().includes(q);
        })
      ));
      return globallyFiltered;
    }
    return filteredData;
  }, [filteredData, enableGlobalSearch, globalQuery, columns]);

  const tableColumns = useMemo(() => {
    const enableRowSelection = Boolean(onBulkDelete);

    const selectionColumn = enableRowSelection ? {
      id: 'select',
      header: () => {
        // Calculate current page rows directly from data instead of using table
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const currentPageRows = (tableData || []).slice(startIndex, endIndex);
        const allSelected = currentPageRows.length > 0 && currentPageRows.every(r => selectedIds.has(r.id));
        const someSelected = currentPageRows.some(r => selectedIds.has(r.id));
        return (
          <div className="w-8">
            <Checkbox
              aria-label="Seleziona tutti"
              checked={allSelected}
              onCheckedChange={(checked) => {
                const newSet = new Set(selectedIds);
                if (checked) {
                  currentPageRows.forEach(r => newSet.add(r.id));
                } else {
                  currentPageRows.forEach(r => newSet.delete(r.id));
                }
                setSelectedIds(newSet);
              }}
              className="mb-2"
            />
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="flex w-8">
          <Checkbox
            aria-label="Seleziona riga"
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(checked) => {
              const newSet = new Set(selectedIds);
              if (checked) newSet.add(row.original.id); else newSet.delete(row.original.id);
              setSelectedIds(newSet);
            }}
          />
        </div>
      )
    } : null;

    const handleEdit = (row) => {
      if (onEditRow) {
        onEditRow(row.original);
      }
    };

    const actionColumn = (onEditRow || onDeleteRow) ? {
      id: 'actions',
      header: 'Azioni',
      cell: ({ row }) => {
        return (
          <div className="flex flex-row gap-1 items-center justify-start">
            {onEditRow && (
              <Button size="xs" variant="outline" onClick={() => handleEdit(row)}>
                Modifica
              </Button>
            )}
            {onDeleteRow && (
              <Button size="xs" variant="destructive" onClick={() => onDeleteRow(row.original)}>
                Elimina
              </Button>
            )}
          </div>
        );
      },
    } : null;
    
    const base = actionColumn ? [...columns, actionColumn] : columns;
    return selectionColumn ? [selectionColumn, ...base] : base;
  }, [columns, onEditRow, onDeleteRow, onBulkDelete, page, pageSize, selectedIds, tableData]);

  // Calculate sticky column positions
  const getStickyLeftPosition = (columnId, columnIndex) => {
    if (!stickyColumns.includes(columnId)) return 0;
    
    let leftPosition = 0;
    for (let i = 0; i < columnIndex; i++) {
      const colId = tableColumns[i]?.id || tableColumns[i]?.accessorKey;
      if (stickyColumns.includes(colId)) {
        // Approximate column widths based on content - adjusted for actual column widths
        if (colId === 'odp_number') leftPosition += 71; // Numero ODP
        else if (colId === 'article_code') leftPosition += 80; // Codice Articolo
        else leftPosition += 100; // Default width
      }
    }
    return leftPosition;
  };

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  // Derive paginated rows from sorted row model
  const allRows = table.getRowModel().rows;
  const pageCount = Math.max(1, Math.ceil(allRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = allRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="rounded-md overflow-hidden h-full flex flex-col">
      {enableGlobalSearch && (
        <div className="flex items-center justify-between p-2 border-b">
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => { setGlobalQuery(e.target.value); setPage(0); }}
            placeholder="Cerca..."
            className="border border-input rounded px-2 py-1 text-sm w-64 text-foreground placeholder-muted-foreground"
          />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm relative">
        <thead className="sticky top-0 z-20 bg-muted/50 border-b border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => {
                const headerKey = `${headerGroup.id}_${header.id}_${headerIndex}`;
                const columnId = header.column.id;
                const isFilterable = enableFiltering && filterableColumns.includes(columnId);
                const isSticky = stickyColumns.includes(columnId);
                
                return (
                  <TableHead 
                    key={headerKey} 
                    onClick={header.column.getToggleSortingHandler()}
                    className={isSticky ? 'sticky top-0 z-30 bg-muted/50 shadow-sm' : ''}
                    style={isSticky ? { 
                      left: `${getStickyLeftPosition(columnId, headerIndex)}px`
                    } : {}}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted()] ?? null}
                      {isFilterable && (
                        <FilterDropdown
                          column={columnId}
                          options={filterOptions[columnId] || []}
                          onFilterChange={handleFilterChange}
                          isOpen={openFilter === columnId}
                          onToggle={() => toggleFilter(columnId)}
                          activeFilter={filters[columnId]}
                        />
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const rowKey = row.original.id || row.id;
            return (
              <TableRow 
                key={rowKey}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell, cellIndex) => {
                  const cellKey = `${rowKey}_${cell.column.id}_${cellIndex}`;
                  const columnId = cell.column.id;
                  const isSticky = stickyColumns.includes(columnId);
                  
                  return (
                    <TableCell 
                      key={cellKey}
                      className={isSticky ? 'sticky z-10 shadow-sm' : ''}
                      style={isSticky ? { 
                        left: `${getStickyLeftPosition(columnId, cellIndex)}px`
                      } : {}}
                      onClick={(e) => {
                        // Prevent row click when clicking on checkboxes or action buttons
                        if (columnId === 'select' || columnId === 'actions') {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </tbody>
        </table>
      </div>
      {/* Pagination footer */}
      <div className="flex items-center justify-between p-2 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Righe per pagina</span>
          <select
            className="border border-input rounded px-2 py-1 text-sm text-foreground"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          {allRows.length === 0 ? '0–0 di 0' : `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, allRows.length)} di ${allRows.length}`}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={currentPage === 0}>
            «
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">Pagina {currentPage + 1} / {pageCount}</span>
          <Button size="sm" variant="outline" onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1}>
            Next
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage(pageCount - 1)} disabled={currentPage >= pageCount - 1}>
            »
          </Button>
        </div>
      </div>
      
      {/* Bottom action bar for selected items */}
      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onExport={onBulkExport ? () => {
          const ids = Array.from(selectedIds);
          onBulkExport(ids);
        } : null}
        onDelete={onBulkDelete ? () => {
          if (confirmAction('Eliminare gli elementi selezionati?')) {
            const ids = Array.from(selectedIds);
            onBulkDelete(ids);
            setSelectedIds(new Set());
          }
        } : null}
      />
    </div>
  );
}

export default DataTable;