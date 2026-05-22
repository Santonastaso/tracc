import { supabase } from './supabase';
import { computeSiloLevels } from './silo-levels';

const TABLE = 'silos';

function requireFields(data, fields) {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`${field} is required`);
    }
  }
}

function requireRange(data, field, min, max) {
  const value = data[field];
  if (value === undefined || value === null) return;
  if (value < min || value > max) {
    throw new Error(`${field} must be between ${min} and ${max}`);
  }
}

async function getById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function getByIdOptional(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

async function insertRow(payload) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateRow(id, payload) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteRow(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export const silosService = {
  getById,

  async getSilosWithLevels(includeMaterials = false) {
    const { data: silos, error: silosError } = await supabase
      .from('silos')
      .select('*')
      .order('id');
    if (silosError) throw silosError;

    const { data: inboundData, error: inboundError } = await supabase
      .from('inbound')
      .select(
        'id, silo_id, quantity_kg, created_at, product, lot_supplier, lot_tf, proteins, humidity, cleaned'
      )
      .order('created_at', { ascending: true });
    if (inboundError) throw inboundError;

    const { data: outboundData, error: outboundError } = await supabase
      .from('outbound')
      .select('silo_id, quantity_kg, items');
    if (outboundError) throw outboundError;

    return computeSiloLevels(silos, inboundData, outboundData, { includeMaterials });
  },

  async createSilo(siloData) {
    requireFields(siloData, ['name', 'capacity_kg']);
    requireRange(siloData, 'capacity_kg', 1, 500000);

    const { data: existingSilo, error: nameError } = await supabase
      .from('silos')
      .select('id, name')
      .eq('name', siloData.name);
    if (nameError) throw nameError;
    if (existingSilo?.length > 0) {
      throw new Error(`Silo with name '${siloData.name}' already exists`);
    }

    return insertRow(siloData);
  },

  async updateSilo(id, updates) {
    const existing = await getByIdOptional(id);
    if (!existing) throw new Error(`Silo ${id} not found`);

    if (updates.capacity_kg !== undefined) {
      requireRange(updates, 'capacity_kg', 1, 500000);
    }

    if (updates.name) {
      const { data: existingSilos, error: nameError } = await supabase
        .from('silos')
        .select('id, name')
        .eq('name', updates.name);
      if (nameError) throw nameError;
      const duplicate = existingSilos?.find((s) => String(s.id) !== String(id));
      if (duplicate) {
        throw new Error(`Silo with name '${updates.name}' already exists`);
      }
    }

    return updateRow(id, updates);
  },

  async deleteSilo(id) {
    const silo = await getByIdOptional(id);
    if (!silo) return null;

    const silosWithLevels = await this.getSilosWithLevels();
    const siloWithLevels = silosWithLevels.find((s) => s.id === id);

    if (siloWithLevels?.currentLevel > 0) {
      throw new Error(
        `Cannot delete silo '${silo.name}' because it contains ${siloWithLevels.currentLevel} kg of material. Please empty the silo first.`
      );
    }

    const { data: recentMovements, error } = await supabase
      .from('inbound')
      .select('id')
      .eq('silo_id', id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);
    if (error) throw error;
    if (recentMovements?.length > 0) {
      throw new Error(
        `Cannot delete silo '${silo.name}' because it has recent movements. Please wait 30 days or contact an administrator.`
      );
    }

    await deleteRow(id);
    return silo;
  },
};
