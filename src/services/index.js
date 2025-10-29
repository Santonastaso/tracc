/**
 * Services Index
 * Centralized export for all application services
 * Provides a clean abstraction layer over direct Supabase calls
 */

// Export base service class
export { BaseService } from '@santonastaso/shared';

// Export error handling utilities
export {
  ServiceError,
  handleSupabaseError,
  validateRequiredFields,
  validateNumericRanges,
  throwBusinessError,
  throwNotFoundError
} from '@santonastaso/shared';

// Export entity services
export { SilosService } from './SilosService.js';
export { InboundService } from './InboundService.js';
export { OutboundService } from './OutboundService.js';
export { MaterialsService } from './MaterialsService.js';
export { OperatorsService } from './OperatorsService.js';

// Export Supabase client
export { supabase } from './supabase/client.js';

// Create service instances
import { SilosService } from './SilosService.js';
import { InboundService } from './InboundService.js';
import { OutboundService } from './OutboundService.js';
import { MaterialsService } from './MaterialsService.js';
import { OperatorsService } from './OperatorsService.js';

/**
 * Service instances for easy access
 * These provide singleton instances of each service
 */
export const silosService = new SilosService();
export const inboundService = new InboundService();
export const outboundService = new OutboundService();
export const materialsService = new MaterialsService();
export const operatorsService = new OperatorsService();

/**
 * Service registry for dynamic service access
 */
export const services = {
  silos: silosService,
  inbound: inboundService,
  outbound: outboundService,
  materials: materialsService,
  operators: operatorsService,
};

/**
 * Initialize all services
 * This can be called during app startup to test connections
 */
export const initializeServices = async () => {
  try {
    // Test database connection
    const { error } = await supabase
      .from('silos')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Service initialization failed: ${error.message}`);
    }
    
    console.log('✅ All services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    throw error;
  }
};

/**
 * Get service by name
 * @param {string} serviceName - Name of the service
 * @returns {Object} Service instance
 */
export const getService = (serviceName) => {
  const service = services[serviceName];
  if (!service) {
    throw new Error(`Service '${serviceName}' not found`);
  }
  return service;
};
