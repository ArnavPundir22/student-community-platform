import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://leowjdfbufhnbgkttxrg.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb3dqZGZidWZobmJna3R0eHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NjU4NTIsImV4cCI6MjEwNjM0MTg1Mn0.t7Z87d_L1Uu3L08l-Z6c76j2i9q-Z9G4r0m00_v1v0k'

class SupabaseService {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export default new SupabaseService()
