import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '../lib/cn';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';

function GenericForm({
  config,
  initialData = {},
  onSubmit,
  onSuccess,
  onCancel,
  showCancel = true,
  isEditMode = false,
  isLoading = false,
  customActions = null,
  customFieldRenderers = {},
  _className = 'bg-card rounded-lg shadow-sm border',
}) {
  const initialFormData = useMemo(() => {
    const formData = {};
    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.name in initialData) {
          formData[field.name] = initialData[field.name];
        } else if (field.defaultValue !== undefined) {
          formData[field.name] = field.defaultValue;
        } else {
          formData[field.name] = '';
        }
      });
    });
    return formData;
  }, [config, initialData]);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    defaultValues: initialFormData,
    mode: 'onChange',
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      if (onSuccess) onSuccess();
      reset(initialFormData);
    } catch {
      // Underlying mutations surface their own error toasts; we only need to
      // stop the form from resetting / calling onSuccess on failure.
    }
  };

  const renderField = (field) => {
    const fieldValue = watch(field.name);
    if (field.conditional && !field.conditional(fieldValue, watch, getValues)) {
      return null;
    }
    if (customFieldRenderers[field.type]) {
      return customFieldRenderers[field.type](field, {
        watch,
        setValue,
        getValues,
        register,
        isSubmitting,
        fieldValue,
      });
    }
    const baseInputProps = {
      id: field.name,
      placeholder: field.placeholder,
      disabled: field.disabled || isSubmitting,
      className: field.className || '',
      ...register(field.name, field.validation || {}),
    };

    switch (field.type) {
      case 'select':
        return (
          <div>
            <select
              {...register(field.name, field.validation)}
              disabled={field.disabled || isSubmitting}
              className={cn(
                'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                errors[field.name] && 'border-destructive',
                field.className
              )}
            >
              <option value="">
                {field.placeholder || `Seleziona ${field.label.toLowerCase()}`}
              </option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors[field.name] && (
              <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div>
            <textarea
              {...baseInputProps}
              rows={field.rows || 3}
              className={cn(
                'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                errors[field.name] && 'border-destructive',
                field.className
              )}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.name}_${option.value}`}
                  value={option.value}
                  checked={fieldValue?.includes(option.value) || false}
                  onChange={(e) => {
                    const currentValues = getValues(field.name) || [];
                    if (e.target.checked) {
                      setValue(field.name, [...currentValues, option.value].sort(), {
                        shouldValidate: true,
                      });
                    } else {
                      setValue(
                        field.name,
                        currentValues.filter((v) => v !== option.value),
                        { shouldValidate: true }
                      );
                    }
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label
                  htmlFor={`${field.name}_${option.value}`}
                  className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );
      case 'datetime-local':
        return (
          <div>
            <Input
              type="datetime-local"
              {...baseInputProps}
              className={`${baseInputProps.className} ${errors[field.name] ? 'border-red-500' : ''}`}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>
            )}
          </div>
        );
      case 'date':
        return (
          <div>
            <Input
              type="date"
              {...baseInputProps}
              className={`${baseInputProps.className} ${errors[field.name] ? 'border-red-500' : ''}`}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>
            )}
          </div>
        );
      case 'time':
        return (
          <div>
            <Input
              type="time"
              {...baseInputProps}
              className={`${baseInputProps.className} ${errors[field.name] ? 'border-red-500' : ''}`}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>
            )}
          </div>
        );
      case 'number':
        return (
          <div>
            <Input
              type="number"
              {...baseInputProps}
              className={`${baseInputProps.className} ${errors[field.name] ? 'border-red-500' : ''}`}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>
            )}
          </div>
        );
      case 'text':
      default:
        return (
          <div>
            <Input
              type="text"
              {...baseInputProps}
              className={`${baseInputProps.className} ${errors[field.name] ? 'border-red-500' : ''}`}
            />
            {errors[field.name] && (
              <p className="text-sm text-destructive mt-1">{errors[field.name].message}</p>
            )}
          </div>
        );
    }
  };

  const renderSection = (section) => {
    const visibleFields = section.fields.filter(
      (field) => !field.conditional || field.conditional(watch(field.name), watch, getValues)
    );
    if (visibleFields.length === 0) return null;
    return (
      <div key={section.title} className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
          {section.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-sm font-medium text-foreground">
                {field.label}{' '}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              {renderField(field)}
              {field.helpText && (
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomSection = (sectionKey) => {
    if (customFieldRenderers[sectionKey]) {
      return customFieldRenderers[sectionKey]();
    }
    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="p-6 space-y-8">
        {config.sections.map(renderSection)}
        {config.customFields &&
          Object.keys(config.customFields).map((sectionKey) => (
            <div key={sectionKey}>{renderCustomSection(sectionKey)}</div>
          ))}
        {customActions && <div className="space-y-4">{customActions}</div>}
        <div
          className={`flex pt-6 border-t border-border ${showCancel ? 'justify-end gap-2' : 'justify-end'}`}
        >
          {showCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel || (() => window.history.back())}
              disabled={isLoading || isSubmitting}
              className="px-6 py-2"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isSubmitting} className="px-6 py-2">
            {isLoading || isSubmitting
              ? isEditMode
                ? config.editLoadingText
                : config.addLoadingText
              : isEditMode
                ? config.editButtonText
                : config.addButtonText}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default GenericForm;
