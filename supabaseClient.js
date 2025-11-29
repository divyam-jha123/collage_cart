import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rmmpfcytckwsmtydqzex.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbXBmY3l0Y2t3c210eWRxemV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTcxMjUsImV4cCI6MjA3OTk5MzEyNX0.AVcIj95O-9-HKnFu4HNMmPIRV3W_H8eFLAO3gZHgKUU"

export const supabase = createClient(supabaseUrl, supabaseKey)
