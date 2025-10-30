import { BaseService } from '@santonastaso/shared';
import { 
  validateRequiredFields, 
  validateNumericRanges,
  throwNotFoundError,
  throwBusinessError,
  ServiceError
} from '@santonastaso/shared';
import { supabase } from './supabase/client';

/**
 * Simple safeAsync replacement - wraps async operations with error handling
 */
const safeAsync = async (asyncFn) => {
  try {
    return await asyncFn();
  } catch (error) {
    throw error;
  }
};

/**
 * Silos Service
 * Handles all silos-related operations with business logic
 */
export class SilosService extends BaseService {
  constructor() {
    super('silos');
  }

  /**
   * Get all silos with current levels and available lots
   * @param {boolean} includeMaterials - Whether to include materials object in available items
   * @returns {Promise<Array>} Array of silos with calculated levels and items
   */
  async getSilosWithLevels(includeMaterials = false) {
    return safeAsync(async () => {
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
          totalOutbound,
          utilizationPercentage: silo.capacity_kg > 0 ? (currentLevel / silo.capacity_kg) * 100 : 0
        };
      });

      return silosWithData;
    }, 'getSilosWithLevels');
  }

  /**
   * Create a new silo with validation
   * @param {Object} siloData - Silo data
   * @returns {Promise<Object>} Created silo
   */
  async createSilo(siloData) {
    return safeAsync(async () => {
      // Validate required fields
      validateRequiredFields(siloData, ['name', 'capacity_kg']);

      // Validate numeric ranges
      validateNumericRanges(siloData, {
        capacity_kg: { min: 1, max: 500000 }
      });

      // Check for duplicate name
      const existingSilo = await this.getByField('name', siloData.name);
      if (existingSilo.length > 0) {
        throw createServiceError(
          `Silo with name '${siloData.name}' already exists`,
          ERROR_TYPES.DUPLICATE_ERROR,
          409,
          null,
          'createSilo'
        );
      }

      // Create the silo
      const silo = await this.create(siloData);
      
      return silo;
    }, 'createSilo');
  }

  /**
   * Update a silo with validation
   * @param {string|number} id - Silo ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated silo
   */
  async updateSilo(id, updates) {
    return safeAsync(async () => {
      // Check if silo exists
      const exists = await this.exists(id);
      if (!exists) {
        throwNotFoundError('Silo', id);
      }

      // Validate numeric ranges if capacity is being updated
      if (updates.capacity_kg !== undefined) {
        validateNumericRanges(updates, {
          capacity_kg: { min: 1, max: 500000 }
        });
      }

      // Check for duplicate name if name is being updated
      if (updates.name) {
        const existingSilos = await this.getByField('name', updates.name);
        const duplicateSilo = existingSilos.find(silo => silo.id !== id);
        if (duplicateSilo) {
          throw createServiceError(
            `Silo with name '${updates.name}' already exists`,
            ERROR_TYPES.DUPLICATE_ERROR,
            409,
            null,
            'updateSilo'
          );
        }
      }

      // Update the silo
      const updatedSilo = await this.update(id, updates);
      
      return updatedSilo;
    }, 'updateSilo');
  }

  /**
   * Delete a silo with business logic validation
   * @param {string|number} id - Silo ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSilo(id) {
    return safeAsync(async () => {
      // Check if silo exists
      const silo = await this.getById(id);
      if (!silo) {
        throwNotFoundError('Silo', id);
      }

      // Check if silo has current stock
      const silosWithLevels = await this.getSilosWithLevels();
      const siloWithLevels = silosWithLevels.find(s => s.id === id);
      
      if (siloWithLevels && siloWithLevels.currentLevel > 0) {
        throwBusinessError(
          `Cannot delete silo '${silo.name}' because it contains ${siloWithLevels.currentLevel} kg of material. Please empty the silo first.`
        );
      }

      // Check if silo has recent movements
      const { data: recentMovements, error } = await supabase
        .from('inbound')
        .select('id')
        .eq('silo_id', id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .limit(1);

      if (error) throw error;

      if (recentMovements && recentMovements.length > 0) {
        throwBusinessError(
          `Cannot delete silo '${silo.name}' because it has recent movements. Please wait 30 days or contact an administrator.`
        );
      }

      // Delete the silo
      const success = await this.delete(id);
      
      return success;
    }, 'deleteSilo');
  }

  /**
   * Get silos by material compatibility
   * @param {string|number} materialId - Material ID
   * @returns {Promise<Array>} Array of compatible silos
   */
  async getSilosByMaterial(materialId) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('silos')
        .select('*')
        .contains('allowed_material_ids', [materialId])
        .order('name');
      
      if (error) throw error;
      return data || [];
    }, 'getSilosByMaterial');
  }

  /**
   * Get silos by capacity range
   * @param {number} minCapacity - Minimum capacity
   * @param {number} maxCapacity - Maximum capacity (optional)
   * @returns {Promise<Array>} Array of silos in capacity range
   */
  async getSilosByCapacity(minCapacity, maxCapacity = null) {
    return safeAsync(async () => {
      let query = supabase
        .from('silos')
        .select('*')
        .gte('capacity_kg', minCapacity)
        .order('capacity_kg');

      if (maxCapacity !== null) {
        query = query.lte('capacity_kg', maxCapacity);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }, 'getSilosByCapacity');
  }

  /**
   * Get silos utilization statistics
   * @returns {Promise<Object>} Utilization statistics
   */
  async getUtilizationStats() {
    return safeAsync(async () => {
      const silosWithLevels = await this.getSilosWithLevels();
      
      const stats = {
        totalSilos: silosWithLevels.length,
        totalCapacity: silosWithLevels.reduce((sum, silo) => sum + silo.capacity_kg, 0),
        totalCurrentStock: silosWithLevels.reduce((sum, silo) => sum + silo.currentLevel, 0),
        averageUtilization: 0,
        silosByUtilization: {
          empty: 0,
          low: 0,
          medium: 0,
          high: 0,
          full: 0
        }
      };

      if (stats.totalSilos > 0) {
        stats.averageUtilization = silosWithLevels.reduce((sum, silo) => sum + silo.utilizationPercentage, 0) / stats.totalSilos;
        
        silosWithLevels.forEach(silo => {
          if (!silo || silo.utilizationPercentage === null || silo.utilizationPercentage === undefined) return;
          const utilization = silo.utilizationPercentage;
          if (utilization === 0) stats.silosByUtilization.empty++;
          else if (utilization < 25) stats.silosByUtilization.low++;
          else if (utilization < 50) stats.silosByUtilization.medium++;
          else if (utilization < 90) stats.silosByUtilization.high++;
          else stats.silosByUtilization.full++;
        });
      }

      return stats;
    }, 'getUtilizationStats');
  }
}

