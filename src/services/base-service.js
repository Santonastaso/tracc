import { handleSupabaseError } from './supabase/client';

export class BaseService {
  constructor(client, tableName) {
    this.client = client;
    this.tableName = tableName;
  }

  handleError(error, context = '') {
    const message = handleSupabaseError(error);
    throw new Error(context ? `${context}: ${message}` : message);
  }

  async getAll(options = {}) {
    let query = this.client
      .from(this.tableName)
      .select(options.select || '*')
      .order(options.orderBy || 'created_at', { ascending: options.ascending !== false });

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.like(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) this.handleError(error, `${this.tableName}.getAll`);
    return data || [];
  }

  async getById(id, select = '*') {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();
    if (error) this.handleError(error, `${this.tableName}.getById`);
    return data;
  }

  /** Returns null when the row does not exist (e.g. already deleted). */
  async getByIdOptional(id, select = '*') {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      this.handleError(error, `${this.tableName}.getById`);
    }
    return data;
  }

  async create(data) {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    if (error) this.handleError(error, `${this.tableName}.create`);
    return result;
  }

  async update(id, data) {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) this.handleError(error, `${this.tableName}.update`);
    return result;
  }

  async delete(id) {
    const { error } = await this.client.from(this.tableName).delete().eq('id', id);
    if (error) this.handleError(error, `${this.tableName}.delete`);
  }

  async bulkDelete(ids) {
    const { error } = await this.client.from(this.tableName).delete().in('id', ids);
    if (error) this.handleError(error, `${this.tableName}.bulkDelete`);
  }
}
