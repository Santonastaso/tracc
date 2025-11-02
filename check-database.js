import { createClient } from '@supabase/supabase-js';

// Use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
  console.error('Please create a .env file with these variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('Checking database connection and tables...');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('silos')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    console.log('✅ Connection successful');

    // Check if tables exist
    const tables = ['silos', 'materials', 'suppliers', 'operators', 'inbound', 'outbound'];
    
    for (const table of tables) {
      console.log(`2. Checking table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table} error:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    }

    // Check if we have any data
    console.log('3. Checking for existing data...');
    const { data: silosData, error: silosError } = await supabase
      .from('silos')
      .select('*');
    
    if (silosError) {
      console.error('❌ Error fetching silos:', silosError);
    } else {
      console.log(`✅ Found ${silosData.length} silos`);
      if (silosData.length === 0) {
        console.log('⚠️  No silos found - this might cause the white screen issue');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabase();
