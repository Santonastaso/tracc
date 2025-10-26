import { BaseService } from '@andrea/crm-data';
import { 
  safeAsync, 
  validateRequiredFields, 
  validateNumericRanges,
  throwNotFoundError,
  throwBusinessError,
  createServiceError,
  ERROR_TYPES
} from './errorHandling';
import { supabase } from './supabase/client';

/**
 * Inbound Service
 * Handles all inbound movements with business logic
 */
export class InboundService extends BaseService {
  constructor() {
    super('inbound');
  }

  /**
   * Create a new inbound movement with validation
   * @param {Object} inboundData - Inbound data
   * @returns {Promise<Object>} Created inbound movement
   */
  async createInbound(inboundData) {
    return safeAsync(async () => {
      // Validate required fields
      validateRequiredFields(inboundData, ['silo_id', 'quantity_kg', 'product']);

      // Validate numeric ranges
      validateNumericRanges(inboundData, {
        quantity_kg: { min: 0.1, max: 100000 },
        proteins: { min: 0, max: 100 },
        humidity: { min: 0, max: 100 }
      });

      // Validate silo exists and has capacity
      await this.validateSiloCapacity(inboundData.silo_id, inboundData.quantity_kg);

      // Create the inbound movement
      const inbound = await this.create(inboundData);
      
      return inbound;
    }, 'createInbound');
  }

  /**
   * Update an inbound movement with validation
   * @param {string|number} id - Inbound ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated inbound movement
   */
  async updateInbound(id, updates) {
    return safeAsync(async () => {
      // Check if inbound exists
      const existingInbound = await this.getById(id);
      if (!existingInbound) {
        throwNotFoundError('Inbound movement', id);
      }

      // Validate numeric ranges if quantity is being updated
      if (updates.quantity_kg !== undefined) {
        validateNumericRanges(updates, {
          quantity_kg: { min: 0.1, max: 100000 }
        });
      }

      // Validate silo capacity if silo or quantity is being updated
      if (updates.silo_id || updates.quantity_kg) {
        const siloId = updates.silo_id || existingInbound.silo_id;
        const quantity = updates.quantity_kg || existingInbound.quantity_kg;
        await this.validateSiloCapacity(siloId, quantity);
      }

      // Update the inbound movement
      const updatedInbound = await this.update(id, updates);
      
      return updatedInbound;
    }, 'updateInbound');
  }

  /**
   * Delete an inbound movement with business logic validation
   * @param {string|number} id - Inbound ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteInbound(id) {
    return safeAsync(async () => {
      // Check if inbound exists
      const inbound = await this.getById(id);
      if (!inbound) {
        throwNotFoundError('Inbound movement', id);
      }

      // Check if inbound has been used in outbound movements
      const { data: outboundUsage, error } = await supabase
        .from('outbound')
        .select('id, items')
        .contains('items', [{ inbound_id: id }])
        .limit(1);

      if (error) throw error;

      if (outboundUsage && outboundUsage.length > 0) {
        throwBusinessError(
          `Cannot delete inbound movement because it has been used in outbound movements. Please delete the related outbound movements first.`
        );
      }

      // Check if movement is recent (within 24 hours)
      const movementDate = new Date(inbound.created_at);
      const now = new Date();
      const hoursDiff = (now - movementDate) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throwBusinessError(
          `Cannot delete inbound movement older than 24 hours. Please contact an administrator.`
        );
      }

      // Delete the inbound movement
      const success = await this.delete(id);
      
      return success;
    }, 'deleteInbound');
  }

  /**
   * Get inbound movements by silo
   * @param {string|number} siloId - Silo ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of inbound movements
   */
  async getInboundBySilo(siloId, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('silo_id', siloId)
        .order('created_at', { ascending: options.ascending !== false })
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getInboundBySilo');
  }

  /**
   * Get inbound movements by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of inbound movements
   */
  async getInboundByDateRange(startDate, endDate, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`)
        .order('created_at', { ascending: options.ascending !== false })
        .limit(options.limit || 1000);
      
      if (error) throw error;
      return data || [];
    }, 'getInboundByDateRange');
  }

  /**
   * Get inbound movements by product
   * @param {string} product - Product name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of inbound movements
   */
  async getInboundByProduct(product, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('inbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('product', product)
        .order('created_at', { ascending: options.ascending !== false })
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getInboundByProduct');
  }

  /**
   * Get inbound statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Inbound statistics
   */
  async getInboundStats(filters = {}) {
    return safeAsync(async () => {
      let query = supabase
        .from('inbound')
        .select('quantity_kg, product, created_at, silo_id');

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', `${filters.startDate}T00:00:00.000Z`);
      }
      if (filters.endDate) {
        query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);
      }
      if (filters.siloId) {
        query = query.eq('silo_id', filters.siloId);
      }
      if (filters.product) {
        query = query.eq('product', filters.product);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        totalMovements: data.length,
        totalQuantity: data.reduce((sum, item) => sum + item.quantity_kg, 0),
        averageQuantity: 0,
        products: {},
        silos: {},
        dailyStats: {}
      };

      if (stats.totalMovements > 0) {
        stats.averageQuantity = stats.totalQuantity / stats.totalMovements;

        // Group by product
        data.forEach(item => {
          if (!stats.products[item.product]) {
            stats.products[item.product] = { count: 0, quantity: 0 };
          }
          stats.products[item.product].count++;
          stats.products[item.product].quantity += item.quantity_kg;
        });

        // Group by silo
        data.forEach(item => {
          if (!stats.silos[item.silo_id]) {
            stats.silos[item.silo_id] = { count: 0, quantity: 0 };
          }
          stats.silos[item.silo_id].count++;
          stats.silos[item.silo_id].quantity += item.quantity_kg;
        });

        // Group by day
        data.forEach(item => {
          const date = item.created_at.split('T')[0];
          if (!stats.dailyStats[date]) {
            stats.dailyStats[date] = { count: 0, quantity: 0 };
          }
          stats.dailyStats[date].count++;
          stats.dailyStats[date].quantity += item.quantity_kg;
        });
      }

      return stats;
    }, 'getInboundStats');
  }

  /**
   * Validate silo capacity before adding inbound
   * @param {string|number} siloId - Silo ID
   * @param {number} quantity - Quantity to add
   * @private
   */
  async validateSiloCapacity(siloId, quantity) {
    // Get silo information
    const { data: silo, error: siloError } = await supabase
      .from('silos')
      .select('capacity_kg, name')
      .eq('id', siloId)
      .single();

    if (siloError) throw siloError;
    if (!silo) {
      throwNotFoundError('Silo', siloId);
    }

    // Get current silo level
    const { data: inboundData, error: inboundError } = await supabase
      .from('inbound')
      .select('quantity_kg')
      .eq('silo_id', siloId);

    if (inboundError) throw inboundError;

    const { data: outboundData, error: outboundError } = await supabase
      .from('outbound')
      .select('quantity_kg')
      .eq('silo_id', siloId);

    if (outboundError) throw outboundError;

    const totalInbound = inboundData.reduce((sum, item) => sum + item.quantity_kg, 0);
    const totalOutbound = outboundData.reduce((sum, item) => sum + item.quantity_kg, 0);
    const currentLevel = totalInbound - totalOutbound;
    const newLevel = currentLevel + quantity;

    if (newLevel > silo.capacity_kg) {
      throwBusinessError(
        `Cannot add ${quantity} kg to silo '${silo.name}'. Would exceed capacity of ${silo.capacity_kg} kg. Current level: ${currentLevel} kg.`
      );
    }
  }
}

