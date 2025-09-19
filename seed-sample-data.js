#!/usr/bin/env node

/**
 * Sample data seeding script for Tracc application
 * This script adds sample data to your Supabase database
 * 
 * Usage: node seed-sample-data.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://odlymzidujfrvufeocsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbHltemlkdWpmcnZ1ZmVvY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDIyNzYsImV4cCI6MjA3MTQxODI3Nn0.tfugegm1hUJnaF0QjqlOmGKdTXQshGBxeW7bBf2iQNA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sample data
const sampleInboundData = [
  {
    silo_id: 1,
    product: 'Grano Tenero',
    lot_supplier: 'LOT001',
    lot_tf: 'TF001',
    quantity_kg: 5000,
    supplier: 'Fornitore A',
    analysis_date: new Date().toISOString(),
    protein_content: 12.5,
    moisture_content: 13.2,
    ash_content: 1.8,
    falling_number: 350,
    gluten_index: 85,
    notes: 'Qualità eccellente'
  },
  {
    silo_id: 2,
    product: 'Grano Duro',
    lot_supplier: 'LOT002',
    lot_tf: 'TF002',
    quantity_kg: 7500,
    supplier: 'Fornitore B',
    analysis_date: new Date().toISOString(),
    protein_content: 14.2,
    moisture_content: 12.8,
    ash_content: 1.9,
    falling_number: 420,
    gluten_index: 92,
    notes: 'Proteine elevate'
  },
  {
    silo_id: 3,
    product: 'Grano Tenero',
    lot_supplier: 'LOT003',
    lot_tf: 'TF003',
    quantity_kg: 3000,
    supplier: 'Fornitore C',
    analysis_date: new Date().toISOString(),
    protein_content: 11.8,
    moisture_content: 14.1,
    ash_content: 1.7,
    falling_number: 320,
    gluten_index: 78,
    notes: 'Umidità leggermente alta'
  }
];

const sampleOutboundData = [
  {
    silo_id: 1,
    quantity_kg: 2000,
    items: [
      { lot_tf: 'TF001', quantity_kg: 2000 }
    ],
    destination: 'Produzione Pane',
    notes: 'Lotto per produzione pane bianco'
  },
  {
    silo_id: 2,
    quantity_kg: 1500,
    items: [
      { lot_tf: 'TF002', quantity_kg: 1500 }
    ],
    destination: 'Produzione Pasta',
    notes: 'Lotto per produzione pasta'
  }
];

async function seedData() {
  console.log('🌱 Starting data seeding...');
  
  try {
    // Insert sample inbound data
    console.log('📥 Inserting sample inbound data...');
    const { data: inboundResult, error: inboundError } = await supabase
      .from('inbound')
      .insert(sampleInboundData);
    
    if (inboundError) {
      console.error('❌ Error inserting inbound data:', inboundError);
    } else {
      console.log('✅ Inbound data inserted successfully');
    }
    
    // Insert sample outbound data
    console.log('📤 Inserting sample outbound data...');
    const { data: outboundResult, error: outboundError } = await supabase
      .from('outbound')
      .insert(sampleOutboundData);
    
    if (outboundError) {
      console.error('❌ Error inserting outbound data:', outboundError);
    } else {
      console.log('✅ Outbound data inserted successfully');
    }
    
    console.log('🎉 Data seeding completed!');
    console.log('📊 Your dashboard should now show sample data.');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Run the seeding
seedData();
