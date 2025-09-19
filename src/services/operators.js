import { supabase } from './supabase/client';

/**
 * Fetch all active operators from the database
 * @returns {Promise<Array>} Array of operators
 */
export const fetchOperators = async () => {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch operators: ${error.message}`);
  }

  return data || [];
};

/**
 * Fetch a single operator by ID
 * @param {number} id - Operator ID
 * @returns {Promise<Object>} Operator object
 */
export const fetchOperatorById = async (id) => {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch operator: ${error.message}`);
  }

  return data;
};

/**
 * Create a new operator
 * @param {Object} operatorData - Operator data
 * @returns {Promise<Object>} Created operator
 */
export const createOperator = async (operatorData) => {
  const { data, error } = await supabase
    .from('operators')
    .insert([operatorData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create operator: ${error.message}`);
  }

  return data;
};

/**
 * Update an existing operator
 * @param {number} id - Operator ID
 * @param {Object} operatorData - Updated operator data
 * @returns {Promise<Object>} Updated operator
 */
export const updateOperator = async (id, operatorData) => {
  const { data, error } = await supabase
    .from('operators')
    .update(operatorData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update operator: ${error.message}`);
  }

  return data;
};

/**
 * Delete an operator (soft delete by setting active to false)
 * @param {number} id - Operator ID
 * @returns {Promise<void>}
 */
export const deleteOperator = async (id) => {
  const { error } = await supabase
    .from('operators')
    .update({ active: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete operator: ${error.message}`);
  }
};
