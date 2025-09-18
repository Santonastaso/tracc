import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://odlymzidujfrvufeocsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kbHltemlkdWpmcnZ1ZmVvY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDIyNzYsImV4cCI6MjA3MTQxODI3Nn0.tfugegm1hUJnaF0QjqlOmGKdTXQshGBxeW7bBf2iQNA';

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
