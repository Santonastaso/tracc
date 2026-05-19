import { BaseService } from './base-service.js';
import { supabase } from './supabase/client.js';
import { computeSiloLevels } from '../lib/silo-levels.js';

function requireFields(data, fields) {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`${field} is required`);
    }
  }
}

function requireRange(data, field, min, max) {
  const value = data[field];
  if (value === undefined || value === null) return;
  if (value < min || value > max) {
    throw new Error(`${field} must be between ${min} and ${max}`);
  }
}

/**
 * Silos Service
 * Handles all silos-related operations with business logic
 */
export class SilosService extends BaseService {
  constructor() {
    super(supabase, 'silos');
  }

  /**
   * Get all silos with current levels and available lots
   * @param {boolean} includeMaterials - Whether to include materials object in available items
   * @returns {Promise<Array>} Array of silos with calculated levels and items
   */
  async getSilosWithLevels(includeMaterials = false) {
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

      return computeSiloLevels(silos, inboundData, outboundData, { includeMaterials });
  }

  /**
   * Create a new silo with validation
   * @param {Object} siloData - Silo data
   * @returns {Promise<Object>} Created silo
   */
  async createSilo(siloData) {
    requireFields(siloData, ['name', 'capacity_kg']);
    requireRange(siloData, 'capacity_kg', 1, 500000);

    const { data: existingSilo, error: nameError } = await supabase
      .from('silos')
      .select('id, name')
      .eq('name', siloData.name);

    if (nameError) throw nameError;
    if (existingSilo?.length > 0) {
      throw new Error(`Silo with name '${siloData.name}' already exists`);
    }

    return this.create(siloData);
  }

  /**
   * Update a silo with validation
   * @param {string|number} id - Silo ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated silo
   */
  async updateSilo(id, updates) {
    const existingSilo = await this.getById(id).catch(() => null);
    if (!existingSilo) {
      throw new Error(`Silo ${id} not found`);
    }

    if (updates.capacity_kg !== undefined) {
      requireRange(updates, 'capacity_kg', 1, 500000);
    }

    if (updates.name) {
      const { data: existingSilos, error: nameError } = await supabase
        .from('silos')
        .select('id, name')
        .eq('name', updates.name);

      if (nameError) throw nameError;
      const duplicate = existingSilos?.find((s) => String(s.id) !== String(id));
      if (duplicate) {
        throw new Error(`Silo with name '${updates.name}' already exists`);
      }
    }

    return this.update(id, updates);
  }

  /**
   * Delete a silo with business logic validation
   * @param {string|number} id - Silo ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSilo(id) {
    const silo = await this.getByIdOptional(id);
    if (!silo) return null;

    const silosWithLevels = await this.getSilosWithLevels();
    const siloWithLevels = silosWithLevels.find((s) => s.id === id);

    if (siloWithLevels?.currentLevel > 0) {
      throw new Error(
        `Cannot delete silo '${silo.name}' because it contains ${siloWithLevels.currentLevel} kg of material. Please empty the silo first.`
      );
    }

    const { data: recentMovements, error } = await supabase
      .from('inbound')
      .select('id')
      .eq('silo_id', id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (error) throw error;
    if (recentMovements?.length > 0) {
      throw new Error(
        `Cannot delete silo '${silo.name}' because it has recent movements. Please wait 30 days or contact an administrator.`
      );
    }

    await this.delete(id);
    return silo;
  }
}

