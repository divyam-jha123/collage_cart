import { createClient } from '@supabase/supabase-js'

// Use environment variables if available (for production), otherwise use fallback values for local development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rmmpfcytckwsmtydqzex.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbXBmY3l0Y2t3c210eWRxemV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTcxMjUsImV4cCI6MjA3OTk5MzEyNX0.AVcIj95O-9-HKnFu4HNMmPIRV3W_H8eFLAO3gZHgKUU"

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials are missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey)
