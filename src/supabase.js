import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jzbqicxycryebennqyhe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YnFpY3h5Y3J5ZWJlbm5xeWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzQ1NTAsImV4cCI6MjA4OTcxMDU1MH0.3ydrT70qUl2HWwirNMlaXfN5AAfRkKKuKkUvCBaiPcQ'

export const supabase = createClient(supabaseUrl, supabaseKey)