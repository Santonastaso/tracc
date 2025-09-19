import { supabase } from './supabase/client';

/**
 * Fetch all active materials from the database
 * @returns {Promise<Array>} Array of materials
 */
export const fetchMaterials = async () => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`);
  }

  return data || [];
};

/**
 * Fetch a single material by ID
 * @param {number} id - Material ID
 * @returns {Promise<Object>} Material object
 */
export const fetchMaterialById = async (id) => {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch material: ${error.message}`);
  }

  return data;
};

/**
 * Create a new material
 * @param {Object} materialData - Material data
 * @returns {Promise<Object>} Created material
 */
export const createMaterial = async (materialData) => {
  const { data, error } = await supabase
    .from('materials')
    .insert([materialData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create material: ${error.message}`);
  }

  return data;
};

/**
 * Update an existing material
 * @param {number} id - Material ID
 * @param {Object} materialData - Updated material data
 * @returns {Promise<Object>} Updated material
 */
export const updateMaterial = async (id, materialData) => {
  const { data, error } = await supabase
    .from('materials')
    .update(materialData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update material: ${error.message}`);
  }

  return data;
};

/**
 * Delete a material (soft delete by setting active to false)
 * @param {number} id - Material ID
 * @returns {Promise<void>}
 */
export const deleteMaterial = async (id) => {
  const { error } = await supabase
    .from('materials')
    .update({ active: false })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete material: ${error.message}`);
  }
};
