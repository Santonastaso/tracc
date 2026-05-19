import React from 'react';

export function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`p-2 ${className}`.trim()}>
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </div>
  );
}
