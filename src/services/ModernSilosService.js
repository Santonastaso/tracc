import { BaseService } from '@andrea/crm-data';
import { supabase } from './supabase/client';

/**
 * Modern Silos Service using CRM Data patterns
 * Demonstrates the new centralized data handling approach
 */
export class ModernSilosService extends BaseService {
  constructor() {
    super(supabase, 'silos');
  }

  /**
   * Get all silos with enhanced filtering and pagination
   */
  async getSilosWithFilters(options = {}) {
    return this.getAll({
      select: 'id, name, capacity, current_level, material_type, location, created_at, updated_at',
      orderBy: 'name',
      ascending: true,
      ...options
    });
  }

  /**
   * Get paginated silos for DataTable
   */
  async getPaginatedSilos(page = 1, perPage = 10, filters = {}) {
    return this.getPaginated({
      select: 'id, name, capacity, current_level, material_type, location, created_at, updated_at',
      orderBy: 'name',
      ascending: true,
      page,
      perPage,
      filters
    });
  }

  /**
   * Search silos by name or material type
   */
  async searchSilos(searchTerm, options = {}) {
    return this.search(searchTerm, ['name', 'material_type'], {
      select: 'id, name, capacity, current_level, material_type, location',
      orderBy: 'name',
      ...options
    });
  }

  /**
   * Get silos by material type
   */
  async getSilosByMaterialType(materialType) {
    return this.getAll({
      filters: { material_type: materialType },
      orderBy: 'name'
    });
  }

  /**
   * Get silos with low capacity (less than 20%)
   */
  async getLowCapacitySilos() {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('id, name, capacity, current_level, material_type')
        .lt('current_level', 0.2)
        .order('current_level', { ascending: true });

      if (error) {
        throw new Error(this.handleSupabaseError(error, 'getLowCapacitySilos'));
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get low capacity silos: ${error.message}`);
    }
  }

  /**
   * Update silo level
   */
  async updateSiloLevel(id, newLevel) {
    if (newLevel < 0 || newLevel > 1) {
      throw new Error('Silo level must be between 0 and 1');
    }

    return this.update(id, {
      current_level: newLevel,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Bulk update silo levels
   */
  async bulkUpdateLevels(updates) {
    const promises = updates.map(({ id, level }) => 
      this.updateSiloLevel(id, level)
    );
    
    return Promise.all(promises);
  }
}
