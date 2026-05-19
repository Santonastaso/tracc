import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { Button } from './button';
import { getNested } from '../lib/get-nested';
import { DATA_TABLE_DEFAULTS } from '../lib/constants';

const Table = ({ children, className, ...props }) => (
  <table
    className={`w-full border-collapse border border-border table-auto ${className || ''}`}
    {...props}
  >
    {children}
  </table>
);

const TableHeader = ({ children }) => (
  <thead className="bg-muted">{children}</thead>
);

const TableBody = ({ children }) => (
  <tbody className="divide-y divide-gray-200">{children}</tbody>
);

const TableRow = ({ children, onClick, className }) => (
  <tr
    onClick={onClick}
    className={`${onClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${className || ''}`}
  >
    {children}
  </tr>
);

const TableHead = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border min-w-0">
    {children}
  </th>
);

const TableCell = ({ children, colSpan, className }) => (
  <td
    colSpan={colSpan}
    className={`px-4 py-3 text-sm text-foreground border-b border-border min-w-0 max-w-xs ${className || ''}`}
  >
    <div
      className="truncate"
      title={typeof children === 'string' ? children : ''}
    >
      {children}
    </div>
  </td>
);

function DataTable({
  data,
  columns: userColumns,
  onEditRow,
  onDeleteRow,
  onRowClick,
  enableFiltering = false,
  _filterableColumns = [],
  _stickyColumns = [],
  onBulkDelete,
  onBulkExport,
  initialPageSize = DATA_TABLE_DEFAULTS.PAGE_SIZE,
  _pageSizeOptions = [...DATA_TABLE_DEFAULTS.PAGE_SIZE_OPTIONS],
  enableGlobalSearch = true,
  enableColumnVisibility = false,
  enableRowSelection = false,
  loading = false,
  emptyMessage = 'No results found.',
  className,
}) {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [pageSize, _setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [globalQuery, setGlobalQuery] = useState('');
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const columns = useMemo(() => {
    const selectionColumn = enableRowSelection
      ? {
          id: 'select',
          header: ({ table: table2 }) => {
            const currentPageRows = table2.getRowModel().rows.map((row) => row.original);
            const allSelected =
              currentPageRows.length > 0 &&
              currentPageRows.every((r) => selectedIds.has(r.id));
            return (
              <div className="w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={(e) => {
                    const newSet = new Set(selectedIds);
                    if (e.target.checked) {
                      currentPageRows.forEach((r) => newSet.add(r.id));
                    } else {
                      currentPageRows.forEach((r) => newSet.delete(r.id));
                    }
                    setSelectedIds(newSet);
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
              </div>
            );
          },
          cell: ({ row }) => (
            <div className="flex w-8">
              <input
                type="checkbox"
                aria-label="Select row"
                checked={selectedIds.has(row.original.id)}
                onChange={(e) => {
                  const newSet = new Set(selectedIds);
                  if (e.target.checked) {
                    newSet.add(row.original.id);
                  } else {
                    newSet.delete(row.original.id);
                  }
                  setSelectedIds(newSet);
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
            </div>
          ),
        }
      : null;

    const actionColumn =
      onEditRow || onDeleteRow
        ? {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
              <div
                className="flex gap-2"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {onEditRow && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onEditRow(row.original);
                    }}
                  >
                    Edit
                  </Button>
                )}
                {onDeleteRow && (
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      await onDeleteRow(row.original);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ),
          }
        : null;

    return [selectionColumn, ...userColumns, actionColumn].filter(Boolean);
  }, [userColumns, onEditRow, onDeleteRow, enableRowSelection, selectedIds]);

  const filteredData = useMemo(() => {
    let result = data;
    if (enableFiltering && Object.keys(filters).length > 0) {
      result = result.filter((item) => {
        return Object.entries(filters).every(([column, filterValue]) => {
          if (!filterValue) return true;
          const value = getNested(item, column);
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      });
    }
    if (enableGlobalSearch && globalQuery) {
      result = result.filter((item) => {
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(globalQuery.toLowerCase())
        );
      });
    }
    return result;
  }, [data, filters, globalQuery, enableFiltering, enableGlobalSearch]);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const table = useReactTable({
    data: paginatedData,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const _handleFilterChange = (column, value) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setGlobalQuery('');
    setPage(0);
  };

  return (
    <div className={`w-full space-y-1 ${className || ''}`}>
      <div className="flex items-center justify-between gap-4">
        {enableGlobalSearch && (
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search all columns..."
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {globalQuery && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Search
            </Button>
          )}
          {enableColumnVisibility && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              >
                Columns ⚙️
              </Button>
              {showColumnDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowColumnDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-20 p-2">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <label
                          key={column.id}
                          className="flex items-center gap-2 p-1 hover:bg-accent rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="h-4 w-4 rounded border-border"
                          />
                          <span className="text-sm capitalize">
                            {column.id
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())}
                          </span>
                        </label>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-2'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="ml-1">
                              {{
                                asc: '↑',
                                desc: '↓',
                              }[header.column.getIsSorted()] ?? '↕️'}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">📋</div>
                      <div>{emptyMessage}</div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {page * pageSize + 1} to{' '}
          {Math.min((page + 1) * pageSize, filteredData.length)} of {filteredData.length}{' '}
          results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (onBulkDelete || onBulkExport) && (
        <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4 -mb-4 rounded-b-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
              <span className="text-sm font-medium">
                {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              {onBulkExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkExport(Array.from(selectedIds))}
                >
                  📤 Export
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    const ids = Array.from(selectedIds);
                    const result = await onBulkDelete(ids);
                    if (result !== false) {
                      setSelectedIds(new Set());
                    }
                  }}
                >
                  🗑️ Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
