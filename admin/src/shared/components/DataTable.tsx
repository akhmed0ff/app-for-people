'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search',
}: {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="rounded-lg border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line p-3">
        <Search className="text-muted" size={18} />
        <input
          className="h-10 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted"
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={searchPlaceholder}
          value={globalFilter}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-black/[0.03] text-xs uppercase text-muted dark:bg-white/[0.04]">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th className="whitespace-nowrap px-4 py-3 font-black" key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr className="border-t border-line" key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td className="whitespace-nowrap px-4 py-3 font-semibold" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line p-3 text-sm font-bold text-muted">
        <span>{table.getFilteredRowModel().rows.length} rows</span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
          >
            Prev
          </button>
          <button
            className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
