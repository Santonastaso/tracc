import { SupabaseService, createServiceHooks } from '@santonastaso/shared';
import { supabase } from './supabase/client';

/**
 * Modern Tracc Services using the new shared SupabaseService
 * Replaces all individual service classes with standardized patterns
 */

// Create service instances for each table
export const silosService = new SupabaseService(supabase, 'silos');
export const inboundService = new SupabaseService(supabase, 'inbound');
export const outboundService = new SupabaseService(supabase, 'outbound');
export const materialsService = new SupabaseService(supabase, 'materials');
export const operatorsService = new SupabaseService(supabase, 'operators');

// Create React Query hooks for each service
export const useSilosHooks = createServiceHooks(silosService);
export const useInboundHooks = createServiceHooks(inboundService);
export const useOutboundHooks = createServiceHooks(outboundService);
export const useMaterialsHooks = createServiceHooks(materialsService);
export const useOperatorsHooks = createServiceHooks(operatorsService);

/**
 * Enhanced Silos Service with tracc-specific business logic
 */
class EnhancedSilosService extends SupabaseService {
  constructor() {
    super(supabase, 'silos');
  }

  /**
   * Get silos with current levels calculated using FIFO logic
   */
  async getSilosWithLevels(siloIds = null) {
    try {
      // Get silos
      const silosQuery = siloIds 
        ? { filters: { id: siloIds } }
        : {};
      const silos = await this.getAll(silosQuery);

      // Get inbound and outbound movements for level calculation
      const [inboundMovements, outboundMovements] = await Promise.all([
        inboundService.getAll({ orderBy: 'created_at', ascending: true }),
        outboundService.getAll({ orderBy: 'created_at', ascending: true })
      ]);

      // Calculate levels for each silo
      return silos.map(silo => {
        const siloInbound = inboundMovements.filter(m => m.silo_id === silo.id);
        const siloOutbound = outboundMovements.filter(m => m.silo_id === silo.id);

        // Calculate current level using FIFO
        let currentLevel = 0;
        const availableItems = [];

        // Process inbound movements (add to available items)
        siloInbound.forEach(inbound => {
          const item = {
            id: inbound.id,
            quantity_kg: inbound.quantity_kg,
            created_at: inbound.created_at,
            product: inbound.product,
            supplier: inbound.supplier
          };
          availableItems.push(item);
          currentLevel += inbound.quantity_kg;
        });

        // Process outbound movements (remove from available items using FIFO)
        siloOutbound.forEach(outbound => {
          let remainingToRemove = outbound.quantity_kg;
          
          while (remainingToRemove > 0 && availableItems.length > 0) {
            const oldestItem = availableItems[0];
            
            if (oldestItem.quantity_kg <= remainingToRemove) {
              // Remove entire item
              remainingToRemove -= oldestItem.quantity_kg;
              currentLevel -= oldestItem.quantity_kg;
              availableItems.shift();
            } else {
              // Partially remove from item
              oldestItem.quantity_kg -= remainingToRemove;
              currentLevel -= remainingToRemove;
              remainingToRemove = 0;
            }
          }
        });

        return {
          ...silo,
          currentLevel: Math.max(0, currentLevel),
          availableItems,
          utilizationPercentage: silo.capacity_kg > 0 
            ? Math.min(100, (currentLevel / silo.capacity_kg) * 100)
            : 0
        };
      });
    } catch (error) {
      console.error('Error calculating silo levels:', error);
      throw error;
    }
  }

  /**
   * Get silo utilization statistics
   */
  async getSiloUtilizationStats() {
    const silosWithLevels = await this.getSilosWithLevels();
    
    const stats = {
      total: silosWithLevels.length,
      empty: 0,
      low: 0,
      medium: 0,
      high: 0,
      full: 0,
      totalCapacity: 0,
      totalUsed: 0
    };

    silosWithLevels.forEach(silo => {
      stats.totalCapacity += silo.capacity_kg;
      stats.totalUsed += silo.currentLevel;
      
      const utilization = silo.utilizationPercentage;
      
      if (utilization === 0) stats.empty++;
      else if (utilization <= 25) stats.low++;
      else if (utilization <= 50) stats.medium++;
      else if (utilization <= 75) stats.high++;
      else stats.full++;
    });

    stats.overallUtilization = stats.totalCapacity > 0 
      ? (stats.totalUsed / stats.totalCapacity) * 100 
      : 0;

    return stats;
  }

  /**
   * Validate silo capacity before operations
   */
  async validateCapacity(siloId, additionalQuantity) {
    const [silo] = await this.getSilosWithLevels([siloId]);
    
    if (!silo) {
      throw new Error(`Silo with ID ${siloId} not found`);
    }

    const newLevel = silo.currentLevel + additionalQuantity;
    
    if (newLevel > silo.capacity_kg) {
      throw new Error(
        `Capacity exceeded. Silo '${silo.name}' can only accept ${silo.capacity_kg - silo.currentLevel} kg more`
      );
    }

    return true;
  }
}

/**
 * Enhanced Inbound Service with business validation
 */
class EnhancedInboundService extends SupabaseService {
  constructor() {
    super(supabase, 'inbound');
  }

  /**
   * Create inbound movement with capacity validation
   */
  async createInboundWithValidation(inboundData) {
    // Validate capacity
    const enhancedSilosService = new EnhancedSilosService();
    await enhancedSilosService.validateCapacity(inboundData.silo_id, inboundData.quantity_kg);

    // Create the inbound movement
    return this.create({
      ...inboundData,
      created_at: new Date().toISOString()
    });
  }

  /**
   * Get inbound statistics
   */
  async getInboundStats(dateRange = null) {
    const filters = {};
    if (dateRange) {
      // Add date range filter logic here
    }

    const inboundMovements = await this.getAll({ filters });
    
    const stats = {
      total: inboundMovements.length,
      totalQuantity: inboundMovements.reduce((sum, m) => sum + m.quantity_kg, 0),
      byProduct: {},
      bySupplier: {},
      byMonth: {}
    };

    inboundMovements.forEach(movement => {
      // By product
      stats.byProduct[movement.product] = (stats.byProduct[movement.product] || 0) + movement.quantity_kg;
      
      // By supplier
      stats.bySupplier[movement.supplier] = (stats.bySupplier[movement.supplier] || 0) + movement.quantity_kg;
      
      // By month
      const month = new Date(movement.created_at).toISOString().slice(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + movement.quantity_kg;
    });

    return stats;
  }
}

/**
 * Enhanced Outbound Service with FIFO logic
 */
class EnhancedOutboundService extends SupabaseService {
  constructor() {
    super(supabase, 'outbound');
  }

  /**
   * Create outbound movement with FIFO validation
   */
  async createOutboundWithValidation(outboundData) {
    // Get silo with current levels and available items
    const enhancedSilosService = new EnhancedSilosService();
    const [silo] = await enhancedSilosService.getSilosWithLevels([outboundData.silo_id]);

    if (!silo) {
      throw new Error(`Silo with ID ${outboundData.silo_id} not found`);
    }

    // Validate sufficient stock
    if (silo.currentLevel < outboundData.quantity_kg) {
      throw new Error(
        `Insufficient stock in silo '${silo.name}'. Available: ${silo.currentLevel} kg, Requested: ${outboundData.quantity_kg} kg`
      );
    }

    // Calculate FIFO items to withdraw
    const itemsToWithdraw = this.calculateFIFOWithdrawal(silo.availableItems, outboundData.quantity_kg);

    // Create the outbound movement with FIFO items
    return this.create({
      ...outboundData,
      items: itemsToWithdraw,
      created_at: new Date().toISOString()
    });
  }

  /**
   * Calculate FIFO withdrawal items
   */
  calculateFIFOWithdrawal(availableItems, quantityToWithdraw) {
    const itemsToWithdraw = [];
    let remainingQuantity = quantityToWithdraw;

    for (const item of availableItems) {
      if (remainingQuantity <= 0) break;

      const quantityFromThisItem = Math.min(item.quantity_kg, remainingQuantity);
      
      itemsToWithdraw.push({
        inbound_id: item.id,
        quantity_kg: quantityFromThisItem,
        product: item.product,
        supplier: item.supplier
      });

      remainingQuantity -= quantityFromThisItem;
    }

    return itemsToWithdraw;
  }

  /**
   * Get outbound statistics
   */
  async getOutboundStats(dateRange = null) {
    const filters = {};
    if (dateRange) {
      // Add date range filter logic here
    }

    const outboundMovements = await this.getAll({ filters });
    
    const stats = {
      total: outboundMovements.length,
      totalQuantity: outboundMovements.reduce((sum, m) => sum + m.quantity_kg, 0),
      byOperator: {},
      byMonth: {}
    };

    outboundMovements.forEach(movement => {
      // By operator
      stats.byOperator[movement.operator_name] = (stats.byOperator[movement.operator_name] || 0) + movement.quantity_kg;
      
      // By month
      const month = new Date(movement.created_at).toISOString().slice(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + movement.quantity_kg;
    });

    return stats;
  }
}

// Create enhanced service instances
export const enhancedSilosService = new EnhancedSilosService();
export const enhancedInboundService = new EnhancedInboundService();
export const enhancedOutboundService = new EnhancedOutboundService();

// Create React Query hooks for enhanced services
export const useEnhancedSilosHooks = createServiceHooks(enhancedSilosService);
export const useEnhancedInboundHooks = createServiceHooks(enhancedInboundService);
export const useEnhancedOutboundHooks = createServiceHooks(enhancedOutboundService);

/**
 * Initialize all services
 */
export const initializeTraccServices = async () => {
  try {
    await Promise.all([
      silosService.init(),
      inboundService.init(),
      outboundService.init(),
      materialsService.init(),
      operatorsService.init()
    ]);
    
    console.log('All tracc services initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize tracc services:', error);
    throw error;
  }
};

// Export legacy API for backward compatibility during migration
export const legacyServices = {
  // Silos
  SilosService: enhancedSilosService,
  
  // Inbound
  InboundService: enhancedInboundService,
  
  // Outbound
  OutboundService: enhancedOutboundService,
  
  // Materials
  MaterialsService: materialsService,
  
  // Operators
  OperatorsService: operatorsService,
  
  // Initialization
  init: initializeTraccServices,
};
