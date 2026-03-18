import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://qlqvxvmjqmwiemgjjsda.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscXZ4dm1qcW13aWVtZ2pqc2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTIwODcsImV4cCI6MjA4OTMyODA4N30.RZycHsXfXBvHBKJ2K4fxP2KNTygPY8FLu6TnVqpLNZw"
)