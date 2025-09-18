import { useCallback } from 'react';

/**
 * Simplified validation hook for the tracc project
 */
export const useValidation = () => {
  
  /**
   * Validate any data against basic rules
   */
  const validate = useCallback((data, rules = {}) => {
    const errors = {};
    
    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];
      
      if (rule.required && (!value || value === '')) {
        errors[field] = `${rule.label || field} is required`;
        return;
      }
      
      if (value && rule.min && value < rule.min) {
        errors[field] = `${rule.label || field} must be at least ${rule.min}`;
        return;
      }
      
      if (value && rule.max && value > rule.max) {
        errors[field] = `${rule.label || field} must be at most ${rule.max}`;
        return;
      }
      
      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = `${rule.label || field} format is invalid`;
        return;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  /**
   * Validate inbound data
   */
  const validateInbound = useCallback((data) => {
    const rules = {
      ddt_number: { required: true, label: 'DDT Number' },
      material_id: { required: true, label: 'Material' },
      quantity_kg: { required: true, min: 0.01, label: 'Quantity' },
      silo_id: { required: true, label: 'Silos' },
      cleaning_status: { required: true, label: 'Cleaning Status' },
      operator_id: { required: true, label: 'Operator' }
    };
    
    return validate(data, rules);
  }, [validate]);

  /**
   * Validate outbound data
   */
  const validateOutbound = useCallback((data) => {
    const rules = {
      silo_id: { required: true, label: 'Silos' },
      quantity_kg: { required: true, min: 0.01, label: 'Quantity' },
      operator_id: { required: true, label: 'Operator' }
    };
    
    return validate(data, rules);
  }, [validate]);

  /**
   * Validate silos data
   */
  const validateSilos = useCallback((data) => {
    const rules = {
      name: { required: true, label: 'Silos Name' },
      capacity_kg: { required: true, min: 1, label: 'Capacity' }
    };
    
    return validate(data, rules);
  }, [validate]);

  return {
    validate,
    validateInbound,
    validateOutbound,
    validateSilos
  };
};

export default useValidation;