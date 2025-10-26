import React from 'react';
import { X, Download, Trash2 } from 'lucide-react';
import { Button } from '@andrea/crm-ui';
import { Card } from './card';

export function BulkActionsToolbar({ 
  selectedCount, 
  onClearSelection, 
  onExport, 
  onDelete 
}) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-2 md:gap-6 md:flex-row items-stretch sm:items-center p-2 px-4 w-[90%] sm:w-fit mx-auto fixed bottom-2 left-0 right-0 z-10 bg-secondary border-border shadow-lg">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="has-[>svg]:px-0"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? 'item selected' : 'items selected'}
        </span>
      </div>
      <div className="flex gap-2">
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}

