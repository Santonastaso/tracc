import { SupabaseClient } from '@supabase/supabase-js';
import { handleSupabaseError } from './supabase';

/**
 * Generic query options for database operations
 */
export interface QueryOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

/**
 * Base Service Class
 * Provides common patterns and utilities for all entity services
 * Implements DRY principles for database operations
 */
export class BaseService {
  protected client: SupabaseClient;
  protected tableName: string;

  constructor(client: SupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  /**
   * Generic method to get all records
   */
  async getAll(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.client
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

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(handleSupabaseError(error, `${this.tableName}.getAll`));
      }

      return data || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Generic method to get a record by ID
   */
  async getById(id: string | number, select = '*'): Promise<any> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(select)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(handleSupabaseError(error, `${this.tableName}.getById`));
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to fetch ${this.tableName} by ID: ${error.message}`);
    }
  }

  /**
   * Generic method to create a new record
   */
  async create(data: Record<string, any>): Promise<any> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(handleSupabaseError(error, `${this.tableName}.create`));
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Generic method to update a record
   */
  async update(id: string | number, data: Record<string, any>): Promise<any> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(handleSupabaseError(error, `${this.tableName}.update`));
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Generic method to delete a record
   */
  async delete(id: string | number): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(handleSupabaseError(error, `${this.tableName}.delete`));
      }
    } catch (error: any) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Generic method to count records
   */
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(handleSupabaseError(error, `${this.tableName}.count`));
      }

      return count || 0;
    } catch (error: any) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }
  }
}
