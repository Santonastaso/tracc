import React from 'react';
import GenericForm from './generic-form';

export function FormPageLayout({
  title,
  editTitle,
  isEditMode = false,
  formConfig,
  initialData = {},
  onSubmit,
  onCancel,
  showCancel = true,
  isLoading = false,
  customActions,
  customFieldRenderers = {},
  className,
}) {
  const pageTitle = isEditMode ? editTitle || title.replace('Nuovo', 'Modifica') : title;

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      <GenericForm
        config={formConfig}
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        showCancel={showCancel}
        isEditMode={isEditMode}
        isLoading={isLoading}
        customActions={customActions}
        customFieldRenderers={customFieldRenderers}
      />
    </div>
  );
}
