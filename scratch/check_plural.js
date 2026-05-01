import { createClient } from '@supabase/supabase-js'

const VITE_SUPABASE_URL = "https://rbyqrbvwpsvdpntkyaoc.supabase.co"
const VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieXFyYnZ3cHN2ZHBudGt5YW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzI0NzIsImV4cCI6MjA4MzA0ODQ3Mn0.Q96e8ARP1ghrOWJJUcH6tEYXVvSVWSm518X0Xv_JbUo"

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

async function checkPlural() {
    try {
        const { data, error } = await supabase.from('players').select('*').limit(1)
        if (error) {
            console.log('players (plural) table error:', error.message)
        } else {
            console.log('players (plural) columns:', data.length > 0 ? Object.keys(data[0]) : 'exists but empty')
        }
    } catch (e) {
        console.error('Execution error:', e)
    }
}

checkPlural()
