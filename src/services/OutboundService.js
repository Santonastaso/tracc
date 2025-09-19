import { BaseService } from './BaseService';
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
 * Outbound Service
 * Handles all outbound movements with FIFO logic and business validation
 */
export class OutboundService extends BaseService {
  constructor() {
    super('outbound');
  }

  /**
   * Create a new outbound movement with FIFO logic
   * @param {Object} outboundData - Outbound data
   * @returns {Promise<Object>} Created outbound movement
   */
  async createOutbound(outboundData) {
    return safeAsync(async () => {
      // Validate required fields
      validateRequiredFields(outboundData, ['silo_id', 'quantity_kg', 'operator_name']);

      // Validate numeric ranges
      validateNumericRanges(outboundData, {
        quantity_kg: { min: 0.1, max: 100000 }
      });

      // Get silo with current levels and available items
      const silosWithLevels = await this.getSilosWithLevels([outboundData.silo_id]);
      const silo = silosWithLevels.find(s => s.id === outboundData.silo_id);

      if (!silo) {
        throwNotFoundError('Silo', outboundData.silo_id);
      }

      // Validate sufficient stock
      if (silo.currentLevel < outboundData.quantity_kg) {
        throwBusinessError(
          `Insufficient stock in silo '${silo.name}'. Available: ${silo.currentLevel} kg, Requested: ${outboundData.quantity_kg} kg`
        );
      }

      // Calculate FIFO items to withdraw
      const itemsToWithdraw = this.calculateFIFOWithdrawal(silo.availableItems, outboundData.quantity_kg);

      // Create the outbound movement with FIFO items
      const outboundMovement = {
        ...outboundData,
        items: itemsToWithdraw,
        quantity_kg: outboundData.quantity_kg
      };

      const outbound = await this.create(outboundMovement);
      
      return outbound;
    }, 'createOutbound');
  }

  /**
   * Update an outbound movement with validation
   * @param {string|number} id - Outbound ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated outbound movement
   */
  async updateOutbound(id, updates) {
    return safeAsync(async () => {
      // Check if outbound exists
      const existingOutbound = await this.getById(id);
      if (!existingOutbound) {
        throwNotFoundError('Outbound movement', id);
      }

      // Check if movement is recent (within 24 hours)
      const movementDate = new Date(existingOutbound.created_at);
      const now = new Date();
      const hoursDiff = (now - movementDate) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throwBusinessError(
          `Cannot update outbound movement older than 24 hours. Please contact an administrator.`
        );
      }

      // Validate numeric ranges if quantity is being updated
      if (updates.quantity_kg !== undefined) {
        validateNumericRanges(updates, {
          quantity_kg: { min: 0.1, max: 100000 }
        });
      }

      // Recalculate FIFO if silo or quantity is being updated
      if (updates.silo_id || updates.quantity_kg) {
        const siloId = updates.silo_id || existingOutbound.silo_id;
        const quantity = updates.quantity_kg || existingOutbound.quantity_kg;

        // Get silo with current levels
        const silosWithLevels = await this.getSilosWithLevels([siloId]);
        const silo = silosWithLevels.find(s => s.id === siloId);

        if (!silo) {
          throwNotFoundError('Silo', siloId);
        }

        // Validate sufficient stock
        if (silo.currentLevel < quantity) {
          throwBusinessError(
            `Insufficient stock in silo '${silo.name}'. Available: ${silo.currentLevel} kg, Requested: ${quantity} kg`
          );
        }

        // Recalculate FIFO items
        updates.items = this.calculateFIFOWithdrawal(silo.availableItems, quantity);
      }

      // Update the outbound movement
      const updatedOutbound = await this.update(id, updates);
      
      return updatedOutbound;
    }, 'updateOutbound');
  }

  /**
   * Delete an outbound movement with business logic validation
   * @param {string|number} id - Outbound ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteOutbound(id) {
    return safeAsync(async () => {
      // Check if outbound exists
      const outbound = await this.getById(id);
      if (!outbound) {
        throwNotFoundError('Outbound movement', id);
      }

      // Check if movement is recent (within 24 hours)
      const movementDate = new Date(outbound.created_at);
      const now = new Date();
      const hoursDiff = (now - movementDate) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        throwBusinessError(
          `Cannot delete outbound movement older than 24 hours. Please contact an administrator.`
        );
      }

      // Delete the outbound movement
      const success = await this.delete(id);
      
      return success;
    }, 'deleteOutbound');
  }

  /**
   * Get outbound movements by silo
   * @param {string|number} siloId - Silo ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of outbound movements
   */
  async getOutboundBySilo(siloId, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('silo_id', siloId)
        .order('created_at', { ascending: options.ascending !== false })
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getOutboundBySilo');
  }

  /**
   * Get outbound movements by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of outbound movements
   */
  async getOutboundByDateRange(startDate, endDate, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('outbound')
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
    }, 'getOutboundByDateRange');
  }

  /**
   * Get outbound movements by operator
   * @param {string} operatorName - Operator name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of outbound movements
   */
  async getOutboundByOperator(operatorName, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('outbound')
        .select(`
          *,
          silos!inner(name)
        `)
        .eq('operator_name', operatorName)
        .order('created_at', { ascending: options.ascending !== false })
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getOutboundByOperator');
  }

  /**
   * Get outbound statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Outbound statistics
   */
  async getOutboundStats(filters = {}) {
    return safeAsync(async () => {
      let query = supabase
        .from('outbound')
        .select('quantity_kg, operator_name, created_at, silo_id, items');

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
      if (filters.operatorName) {
        query = query.eq('operator_name', filters.operatorName);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        totalMovements: data.length,
        totalQuantity: data.reduce((sum, item) => sum + item.quantity_kg, 0),
        averageQuantity: 0,
        operators: {},
        silos: {},
        dailyStats: {},
        products: {}
      };

      if (stats.totalMovements > 0) {
        stats.averageQuantity = stats.totalQuantity / stats.totalMovements;

        // Group by operator
        data.forEach(item => {
          if (!stats.operators[item.operator_name]) {
            stats.operators[item.operator_name] = { count: 0, quantity: 0 };
          }
          stats.operators[item.operator_name].count++;
          stats.operators[item.operator_name].quantity += item.quantity_kg;
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

        // Group by product (from FIFO items)
        data.forEach(item => {
          if (item.items && Array.isArray(item.items)) {
            item.items.forEach(fifoItem => {
              const product = fifoItem.material_name;
              if (!stats.products[product]) {
                stats.products[product] = { count: 0, quantity: 0 };
              }
              stats.products[product].count++;
              stats.products[product].quantity += fifoItem.quantity_kg;
            });
          }
        });
      }

      return stats;
    }, 'getOutboundStats');
  }

  /**
   * Calculate FIFO withdrawal items
   * @param {Array} availableItems - Available items in FIFO order
   * @param {number} requestedQuantity - Quantity to withdraw
   * @returns {Array} Array of items to withdraw
   * @private
   */
  calculateFIFOWithdrawal(availableItems, requestedQuantity) {
    let remainingQuantity = requestedQuantity;
    const itemsToWithdraw = [];

    for (const item of availableItems) {
      if (remainingQuantity <= 0) break;

      const withdrawFromThisItem = Math.min(remainingQuantity, item.available_quantity);
      itemsToWithdraw.push({
        inbound_id: item.id,
        quantity_kg: withdrawFromThisItem,
        material_name: item.product,
        supplier_lot: item.lot_supplier,
        tf_lot: item.lot_tf,
        protein_content: item.proteins,
        moisture_content: item.humidity,
        cleaning_status: item.cleaned,
        entry_date: item.created_at.split('T')[0]
      });

      remainingQuantity -= withdrawFromThisItem;
    }

    if (remainingQuantity > 0) {
      throwBusinessError(
        `FIFO calculation error: ${remainingQuantity} kg could not be allocated from available items`
      );
    }

    return itemsToWithdraw;
  }

  /**
   * Get silos with current levels (helper method)
   * @param {Array} siloIds - Array of silo IDs to get (optional)
   * @returns {Promise<Array>} Array of silos with levels
   * @private
   */
  async getSilosWithLevels(siloIds = null) {
    // This would typically call the SilosService
    // For now, we'll implement a simplified version
    let query = supabase
      .from('silos')
      .select('*')
      .order('id');

    if (siloIds) {
      query = query.in('id', siloIds);
    }

    const { data: silos, error: silosError } = await query;
    if (silosError) throw silosError;

    // Get inbound and outbound data for level calculations
    const { data: inboundData, error: inboundError } = await supabase
      .from('inbound')
      .select('silo_id, quantity_kg, created_at, product, lot_supplier, lot_tf, proteins, humidity, cleaned')
      .order('created_at', { ascending: true });

    if (inboundError) throw inboundError;

    const { data: outboundData, error: outboundError } = await supabase
      .from('outbound')
      .select('silo_id, quantity_kg');

    if (outboundError) throw outboundError;

    // Calculate levels and available items
    return silos.map(silo => {
      const siloInbound = inboundData.filter(item => item.silo_id === silo.id);
      const siloOutbound = outboundData.filter(item => item.silo_id === silo.id);
      
      const totalOutbound = siloOutbound.reduce((sum, out) => sum + out.quantity_kg, 0);
      let remainingOutbound = totalOutbound;
      const availableItems = [];
      
      for (const inbound of siloInbound) {
        if (remainingOutbound <= 0) {
          availableItems.push({
            ...inbound,
            available_quantity: inbound.quantity_kg
          });
        } else if (remainingOutbound < inbound.quantity_kg) {
          const available = inbound.quantity_kg - remainingOutbound;
          availableItems.push({
            ...inbound,
            available_quantity: available
          });
          remainingOutbound = 0;
        } else {
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
  }
}
