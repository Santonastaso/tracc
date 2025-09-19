import { useState, useCallback } from 'react';

/**
 * Custom hook for form validation
 * Provides consistent validation patterns across the application
 */
export const useValidation = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const validateField = useCallback((name, value, rules = {}) => {
    const fieldErrors = [];

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push(`${rules.label || name} is required`);
    }

    // Min length validation
    if (rules.minLength && value && value.toString().length < rules.minLength) {
      fieldErrors.push(`${rules.label || name} must be at least ${rules.minLength} characters`);
    }

    // Max length validation
    if (rules.maxLength && value && value.toString().length > rules.maxLength) {
      fieldErrors.push(`${rules.label || name} must be no more than ${rules.maxLength} characters`);
    }

    // Email validation
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      fieldErrors.push(`${rules.label || name} must be a valid email address`);
    }

    // Number validation
    if (rules.number && value && isNaN(Number(value))) {
      fieldErrors.push(`${rules.label || name} must be a valid number`);
    }

    // Min value validation
    if (rules.min && value && Number(value) < rules.min) {
      fieldErrors.push(`${rules.label || name} must be at least ${rules.min}`);
    }

    // Max value validation
    if (rules.max && value && Number(value) > rules.max) {
      fieldErrors.push(`${rules.label || name} must be no more than ${rules.max}`);
    }

    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, values);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    return fieldErrors;
  }, [values]);

  const validateForm = useCallback((validationRules = {}) => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const fieldValue = values[fieldName];
      const fieldRules = validationRules[fieldName];
      const fieldErrors = validateField(fieldName, fieldValue, fieldRules);
      
      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors[0]; // Take first error
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Common validation rules for the application
  const commonRules = {
    required: (label) => ({ required: true, label }),
    email: (label) => ({ required: true, email: true, label }),
    number: (label, min = null, max = null) => ({
      required: true,
      number: true,
      min,
      max,
      label
    }),
    text: (label, minLength = 1, maxLength = 255) => ({
      required: true,
      minLength,
      maxLength,
      label
    }),
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    resetErrors,
    commonRules,
  };
};