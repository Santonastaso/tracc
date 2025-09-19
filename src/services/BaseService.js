import { supabase } from './supabase/client';
import { convertSupabaseError, createServiceError, ERROR_TYPES } from './errorHandling';

/**
 * Base Service Class
 * Provides common patterns and utilities for all entity services
 * Implements DRY principles for database operations
 */
export class BaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Generic method to get all records
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of records
   */
  async getAll(options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .order(options.orderBy || 'created_at', { ascending: options.ascending !== false });

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            query = query.eq(key, value);
          }
        });
      }

      // Apply date range filter
      if (options.dateRange) {
        const { startDate, endDate, dateField = 'created_at' } = options.dateRange;
        if (startDate) {
          query = query.gte(dateField, `${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
          query = query.lte(dateField, `${endDate}T23:59:59.999Z`);
        }
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        throw convertSupabaseError(error, `${this.tableName}.getAll`);
      }
      
      return data || [];
    } catch (error) {
      if (error.name === 'ServiceError') {
        throw error;
      }
      throw convertSupabaseError(error, `${this.tableName}.getAll`);
    }
  }

  /**
   * Generic method to get a single record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Single record
   */
  async getById(id, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id);

      if (options.single !== false) {
        query = query.single();
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch ${this.tableName} with id ${id}: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error in ${this.tableName}.getById:`, error);
      throw error;
    }
  }

  /**
   * Generic method to create a new record
   * @param {Object} data - Record data
   * @param {Object} options - Insert options
   * @returns {Promise<Object>} Created record
   */
  async create(data, options = {}) {
    try {
      const recordData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let query = supabase
        .from(this.tableName)
        .insert([recordData])
        .select(options.select || '*');

      if (options.single !== false) {
        query = query.single();
      }

      const { data: result, error } = await query;
      
      if (error) {
        throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error in ${this.tableName}.create:`, error);
      throw error;
    }
  }

  /**
   * Generic method to update a record
   * @param {string|number} id - Record ID
   * @param {Object} updates - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated record
   */
  async update(id, updates, options = {}) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      let query = supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select(options.select || '*');

      if (options.single !== false) {
        query = query.single();
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to update ${this.tableName} with id ${id}: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error in ${this.tableName}.update:`, error);
      throw error;
    }
  }

  /**
   * Generic method to delete a record
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Failed to delete ${this.tableName} with id ${id}: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error in ${this.tableName}.delete:`, error);
      throw error;
    }
  }

  /**
   * Generic method to get records by a specific field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of records
   */
  async getByField(field, value, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq(field, value)
        .order(options.orderBy || 'created_at', { ascending: options.ascending !== false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch ${this.tableName} by ${field}: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error in ${this.tableName}.getByField:`, error);
      throw error;
    }
  }

  /**
   * Generic method to get records by date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @param {string} dateField - Date field name (default: 'created_at')
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of records
   */
  async getByDateRange(startDate, endDate, dateField = 'created_at', options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .gte(dateField, `${startDate}T00:00:00.000Z`)
        .lte(dateField, `${endDate}T23:59:59.999Z`)
        .order(options.orderBy || dateField, { ascending: options.ascending !== false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch ${this.tableName} by date range: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error in ${this.tableName}.getByDateRange:`, error);
      throw error;
    }
  }

  /**
   * Generic method to count records
   * @param {Object} filters - Filter conditions
   * @returns {Promise<number>} Record count
   */
  async count(filters = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;
      
      if (error) {
        throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
      }
      
      return count || 0;
    } catch (error) {
      console.error(`Error in ${this.tableName}.count:`, error);
      throw error;
    }
  }

  /**
   * Generic method to check if a record exists
   * @param {string|number} id - Record ID
   * @returns {Promise<boolean>} Existence status
   */
  async exists(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to check existence of ${this.tableName} with id ${id}: ${error.message}`);
      }
      
      return !!data;
    } catch (error) {
      console.error(`Error in ${this.tableName}.exists:`, error);
      throw error;
    }
  }

  /**
   * Generic method to perform bulk operations
   * @param {Array} records - Array of records
   * @param {string} operation - 'insert', 'update', or 'upsert'
   * @param {Object} options - Bulk operation options
   * @returns {Promise<Array>} Array of results
   */
  async bulkOperation(records, operation = 'insert', options = {}) {
    try {
      let query;
      
      switch (operation) {
        case 'insert':
          query = supabase
            .from(this.tableName)
            .insert(records)
            .select(options.select || '*');
          break;
          
        case 'update':
          // For updates, we need to handle each record individually
          const results = [];
          for (const record of records) {
            if (record.id) {
              const result = await this.update(record.id, record, options);
              results.push(result);
            }
          }
          return results;
          
        case 'upsert':
          query = supabase
            .from(this.tableName)
            .upsert(records, { onConflict: options.conflictColumns || 'id' })
            .select(options.select || '*');
          break;
          
        default:
          throw new Error(`Unsupported bulk operation: ${operation}`);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to perform bulk ${operation} on ${this.tableName}: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error in ${this.tableName}.bulkOperation:`, error);
      throw error;
    }
  }
}
