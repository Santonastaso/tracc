import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../ui/data-table';

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => getValue(),
  },
];

const rows = [
  { id: 1, name: 'Alpha', status: 'active' },
  { id: 2, name: 'Beta', status: 'inactive' },
];

describe('DataTable', () => {
  it('renders columns, rows, and global search using current defaults', async () => {
    const user = userEvent.setup();

    render(<DataTable data={rows} columns={columns} />);

    expect(screen.getByRole('columnheader', { name: /^Name/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Status/ })).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search all columns...'), 'alpha');

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 1 of 1 results')).toBeInTheDocument();
  });

  it('keeps row actions from triggering row clicks', async () => {
    const user = userEvent.setup();
    const onEditRow = vi.fn();
    const onDeleteRow = vi.fn();
    const onRowClick = vi.fn();

    render(
      <DataTable
        data={rows}
        columns={columns}
        onEditRow={onEditRow}
        onDeleteRow={onDeleteRow}
        onRowClick={onRowClick}
      />
    );

    const alphaRow = screen.getByText('Alpha').closest('tr');
    await user.click(within(alphaRow).getByRole('button', { name: 'Edit' }));
    await user.click(within(alphaRow).getByRole('button', { name: 'Delete' }));

    expect(onEditRow).toHaveBeenCalledWith(rows[0]);
    expect(onDeleteRow).toHaveBeenCalledWith(rows[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
