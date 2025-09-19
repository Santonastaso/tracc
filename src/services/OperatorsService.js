import { BaseService } from './BaseService';
import { 
  safeAsync, 
  validateRequiredFields,
  throwNotFoundError,
  createServiceError,
  ERROR_TYPES
} from './errorHandling';

/**
 * Operators Service
 * Handles all operators-related operations
 */
export class OperatorsService extends BaseService {
  constructor() {
    super('operators');
  }

  /**
   * Get all active operators
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active operators
   */
  async getActiveOperators(options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('operators')
        .select(options.select || '*')
        .eq('active', true)
        .order('name')
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getActiveOperators');
  }

  /**
   * Create a new operator with validation
   * @param {Object} operatorData - Operator data
   * @returns {Promise<Object>} Created operator
   */
  async createOperator(operatorData) {
    return safeAsync(async () => {
      // Validate required fields
      validateRequiredFields(operatorData, ['name']);

      // Check for duplicate name
      const existingOperator = await this.getByField('name', operatorData.name);
      if (existingOperator.length > 0) {
        throw createServiceError(
          `Operator with name '${operatorData.name}' already exists`,
          ERROR_TYPES.DUPLICATE_ERROR,
          409,
          null,
          'createOperator'
        );
      }

      // Set default values
      const operator = {
        ...operatorData,
        active: operatorData.active !== undefined ? operatorData.active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const createdOperator = await this.create(operator);
      
      return createdOperator;
    }, 'createOperator');
  }

  /**
   * Update an operator with validation
   * @param {string|number} id - Operator ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated operator
   */
  async updateOperator(id, updates) {
    return safeAsync(async () => {
      // Check if operator exists
      const exists = await this.exists(id);
      if (!exists) {
        throwNotFoundError('Operator', id);
      }

      // Check for duplicate name if name is being updated
      if (updates.name) {
        const existingOperators = await this.getByField('name', updates.name);
        const duplicateOperator = existingOperators.find(operator => operator.id !== id);
        if (duplicateOperator) {
          throw createServiceError(
            `Operator with name '${updates.name}' already exists`,
            ERROR_TYPES.DUPLICATE_ERROR,
            409,
            null,
            'updateOperator'
          );
        }
      }

      // Update the operator
      const updatedOperator = await this.update(id, updates);
      
      return updatedOperator;
    }, 'updateOperator');
  }

  /**
   * Soft delete an operator (set active to false)
   * @param {string|number} id - Operator ID
   * @returns {Promise<Object>} Updated operator
   */
  async deactivateOperator(id) {
    return safeAsync(async () => {
      // Check if operator exists
      const exists = await this.exists(id);
      if (!exists) {
        throwNotFoundError('Operator', id);
      }

      // Check if operator has recent movements
      const { data: recentMovements, error } = await supabase
        .from('outbound')
        .select('id')
        .eq('operator_name', id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .limit(1);

      if (error) throw error;

      if (recentMovements && recentMovements.length > 0) {
        throw createServiceError(
          `Cannot deactivate operator because they have recent movements. Please wait 30 days or contact an administrator.`,
          ERROR_TYPES.BUSINESS_LOGIC_ERROR,
          422,
          null,
          'deactivateOperator'
        );
      }

      // Deactivate the operator
      const updatedOperator = await this.update(id, { active: false });
      
      return updatedOperator;
    }, 'deactivateOperator');
  }

  /**
   * Get operators by department
   * @param {string} department - Department name
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of operators in department
   */
  async getOperatorsByDepartment(department, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('operators')
        .select(options.select || '*')
        .eq('department', department)
        .eq('active', true)
        .order('name')
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getOperatorsByDepartment');
  }

  /**
   * Get operator statistics
   * @returns {Promise<Object>} Operator statistics
   */
  async getOperatorStats() {
    return safeAsync(async () => {
      const { data: allOperators, error } = await supabase
        .from('operators')
        .select('active, department');

      if (error) throw error;

      const stats = {
        total: allOperators.length,
        active: 0,
        inactive: 0,
        departments: {}
      };

      allOperators.forEach(operator => {
        if (operator.active) {
          stats.active++;
        } else {
          stats.inactive++;
        }

        if (operator.department) {
          if (!stats.departments[operator.department]) {
            stats.departments[operator.department] = 0;
          }
          stats.departments[operator.department]++;
        }
      });

      return stats;
    }, 'getOperatorStats');
  }

  /**
   * Get operator activity statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Operator activity statistics
   */
  async getOperatorActivityStats(filters = {}) {
    return safeAsync(async () => {
      let query = supabase
        .from('outbound')
        .select('operator_name, quantity_kg, created_at');

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', `${filters.startDate}T00:00:00.000Z`);
      }
      if (filters.endDate) {
        query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        totalMovements: data.length,
        totalQuantity: data.reduce((sum, item) => sum + item.quantity_kg, 0),
        operators: {}
      };

      // Group by operator
      data.forEach(item => {
        if (!stats.operators[item.operator_name]) {
          stats.operators[item.operator_name] = {
            movements: 0,
            quantity: 0,
            averageQuantity: 0
          };
        }
        stats.operators[item.operator_name].movements++;
        stats.operators[item.operator_name].quantity += item.quantity_kg;
      });

      // Calculate averages
      Object.keys(stats.operators).forEach(operatorName => {
        const operator = stats.operators[operatorName];
        operator.averageQuantity = operator.quantity / operator.movements;
      });

      return stats;
    }, 'getOperatorActivityStats');
  }
}
