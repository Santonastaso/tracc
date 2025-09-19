import { supabase } from './supabase/client';

/**
 * Fetch all silos from the database
 * @returns {Promise<Array>} Array of silos
 */
export const fetchSilos = async () => {
  const { data, error } = await supabase
    .from('silos')
    .select('*')
    .order('id');

  if (error) {
    throw new Error(`Failed to fetch silos: ${error.message}`);
  }

  return data || [];
};

/**
 * Fetch a single silo by ID
 * @param {number} id - Silo ID
 * @returns {Promise<Object>} Silo object
 */
export const fetchSiloById = async (id) => {
  const { data, error } = await supabase
    .from('silos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch silo: ${error.message}`);
  }

  return data;
};

/**
 * Fetch silos with current levels and available lots
 * @param {boolean} includeMaterials - Whether to include materials object in available items
 * @returns {Promise<Array>} Array of silos with calculated levels and items
 */
export const fetchSilosWithLevels = async (includeMaterials = false) => {
  // Get silos
  const { data: silos, error: silosError } = await supabase
    .from('silos')
    .select('*')
    .order('id');
  
  if (silosError) throw silosError;

  // Get inbound data for each silo
  const { data: inboundData, error: inboundError } = await supabase
    .from('inbound')
    .select(`
      id,
      silo_id,
      quantity_kg,
      created_at,
      product,
      lot_supplier,
      lot_tf,
      proteins,
      humidity,
      cleaned
    `)
    .order('created_at', { ascending: true }); // FIFO order
  
  if (inboundError) throw inboundError;

  // Get outbound data for each silo
  const { data: outboundData, error: outboundError } = await supabase
    .from('outbound')
    .select('silo_id, quantity_kg, items');
  
  if (outboundError) throw outboundError;

  // Calculate current levels and available items for each silo
  const silosWithData = silos.map(silo => {
    const siloInbound = inboundData.filter(item => item.silo_id === silo.id);
    const siloOutbound = outboundData.filter(item => item.silo_id === silo.id);
    
    // Calculate total outbound quantity
    const totalOutbound = siloOutbound.reduce((sum, out) => sum + out.quantity_kg, 0);
    
    // Calculate available items using FIFO logic
    let remainingOutbound = totalOutbound;
    const availableItems = [];
    
    for (const inbound of siloInbound) {
      if (remainingOutbound <= 0) {
        // All outbound has been accounted for, this item is available
        const item = {
          ...inbound,
          available_quantity: inbound.quantity_kg
        };
        if (includeMaterials) {
          item.materials = { name: inbound.product };
        }
        availableItems.push(item);
      } else if (remainingOutbound < inbound.quantity_kg) {
        // Partial outbound, some of this item is available
        const available = inbound.quantity_kg - remainingOutbound;
        const item = {
          ...inbound,
          available_quantity: available
        };
        if (includeMaterials) {
          item.materials = { name: inbound.product };
        }
        availableItems.push(item);
        remainingOutbound = 0;
      } else {
        // This item is completely outbound
        remainingOutbound -= inbound.quantity_kg;
      }
    }
    
    const totalInbound = siloInbound.reduce((sum, inb) => sum + inb.quantity_kg, 0);
    const currentLevel = totalInbound - totalOutbound;
    
    return {
      ...silo,
      currentLevel,
      availableItems,
      totalInbound,
      totalOutbound
    };
  });

  return silosWithData;
};

/**
 * Create a new silo
 * @param {Object} siloData - Silo data
 * @returns {Promise<Object>} Created silo
 */
export const createSilo = async (siloData) => {
  const { data, error } = await supabase
    .from('silos')
    .insert([siloData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create silo: ${error.message}`);
  }

  return data;
};

/**
 * Update an existing silo
 * @param {number} id - Silo ID
 * @param {Object} siloData - Updated silo data
 * @returns {Promise<Object>} Updated silo
 */
export const updateSilo = async (id, siloData) => {
  const { data, error } = await supabase
    .from('silos')
    .update(siloData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update silo: ${error.message}`);
  }

  return data;
};

/**
 * Delete a silo
 * @param {number} id - Silo ID
 * @returns {Promise<void>}
 */
export const deleteSilo = async (id) => {
  const { error } = await supabase
    .from('silos')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete silo: ${error.message}`);
  }
};
