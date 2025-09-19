import { BaseService } from './BaseService';
import { 
  safeAsync, 
  validateRequiredFields,
  throwNotFoundError,
  createServiceError,
  ERROR_TYPES
} from './errorHandling';

/**
 * Materials Service
 * Handles all materials-related operations
 */
export class MaterialsService extends BaseService {
  constructor() {
    super('materials');
  }

  /**
   * Get all active materials
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active materials
   */
  async getActiveMaterials(options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('materials')
        .select(options.select || '*')
        .eq('active', true)
        .order('name')
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getActiveMaterials');
  }

  /**
   * Create a new material with validation
   * @param {Object} materialData - Material data
   * @returns {Promise<Object>} Created material
   */
  async createMaterial(materialData) {
    return safeAsync(async () => {
      // Validate required fields
      validateRequiredFields(materialData, ['name']);

      // Check for duplicate name
      const existingMaterial = await this.getByField('name', materialData.name);
      if (existingMaterial.length > 0) {
        throw createServiceError(
          `Material with name '${materialData.name}' already exists`,
          ERROR_TYPES.DUPLICATE_ERROR,
          409,
          null,
          'createMaterial'
        );
      }

      // Set default values
      const material = {
        ...materialData,
        active: materialData.active !== undefined ? materialData.active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const createdMaterial = await this.create(material);
      
      return createdMaterial;
    }, 'createMaterial');
  }

  /**
   * Update a material with validation
   * @param {string|number} id - Material ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated material
   */
  async updateMaterial(id, updates) {
    return safeAsync(async () => {
      // Check if material exists
      const exists = await this.exists(id);
      if (!exists) {
        throwNotFoundError('Material', id);
      }

      // Check for duplicate name if name is being updated
      if (updates.name) {
        const existingMaterials = await this.getByField('name', updates.name);
        const duplicateMaterial = existingMaterials.find(material => material.id !== id);
        if (duplicateMaterial) {
          throw createServiceError(
            `Material with name '${updates.name}' already exists`,
            ERROR_TYPES.DUPLICATE_ERROR,
            409,
            null,
            'updateMaterial'
          );
        }
      }

      // Update the material
      const updatedMaterial = await this.update(id, updates);
      
      return updatedMaterial;
    }, 'updateMaterial');
  }

  /**
   * Soft delete a material (set active to false)
   * @param {string|number} id - Material ID
   * @returns {Promise<Object>} Updated material
   */
  async deactivateMaterial(id) {
    return safeAsync(async () => {
      // Check if material exists
      const exists = await this.exists(id);
      if (!exists) {
        throwNotFoundError('Material', id);
      }

      // Check if material is being used in silos
      const { data: silosUsingMaterial, error } = await supabase
        .from('silos')
        .select('id, name')
        .contains('allowed_material_ids', [id])
        .limit(1);

      if (error) throw error;

      if (silosUsingMaterial && silosUsingMaterial.length > 0) {
        throw createServiceError(
          `Cannot deactivate material because it is being used in silos. Please remove it from silos first.`,
          ERROR_TYPES.BUSINESS_LOGIC_ERROR,
          422,
          null,
          'deactivateMaterial'
        );
      }

      // Deactivate the material
      const updatedMaterial = await this.update(id, { active: false });
      
      return updatedMaterial;
    }, 'deactivateMaterial');
  }

  /**
   * Get materials by category
   * @param {string} category - Material category
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of materials in category
   */
  async getMaterialsByCategory(category, options = {}) {
    return safeAsync(async () => {
      const { data, error } = await supabase
        .from('materials')
        .select(options.select || '*')
        .eq('category', category)
        .eq('active', true)
        .order('name')
        .limit(options.limit || 100);
      
      if (error) throw error;
      return data || [];
    }, 'getMaterialsByCategory');
  }

  /**
   * Get material statistics
   * @returns {Promise<Object>} Material statistics
   */
  async getMaterialStats() {
    return safeAsync(async () => {
      const { data: allMaterials, error } = await supabase
        .from('materials')
        .select('active, category');

      if (error) throw error;

      const stats = {
        total: allMaterials.length,
        active: 0,
        inactive: 0,
        categories: {}
      };

      allMaterials.forEach(material => {
        if (material.active) {
          stats.active++;
        } else {
          stats.inactive++;
        }

        if (material.category) {
          if (!stats.categories[material.category]) {
            stats.categories[material.category] = 0;
          }
          stats.categories[material.category]++;
        }
      });

      return stats;
    }, 'getMaterialStats');
  }
}
