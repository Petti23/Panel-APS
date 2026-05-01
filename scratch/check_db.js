import { createClient } from '@supabase/supabase-js'

const VITE_SUPABASE_URL = "https://rbyqrbvwpsvdpntkyaoc.supabase.co"
const VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieXFyYnZ3cHN2ZHBudGt5YW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzI0NzIsImV4cCI6MjA4MzA0ODQ3Mn0.Q96e8ARP1ghrOWJJUcH6tEYXVvSVWSm518X0Xv_JbUo"

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

async function checkSchema() {
    try {
        const { data, error } = await supabase.from('player').select('*').limit(1)
        if (error) {
            console.error('Error fetching player:', error.message)
        } else if (data && data.length > 0) {
            console.log('Player columns:', Object.keys(data[0]))
        } else {
            console.log('Player table empty, but it exists.')
        }

        const { data: ttData, error: ttError } = await supabase.from('team_tournament').select('*').limit(1)
        if (ttError) {
            console.log('team_tournament table error:', ttError.message)
        } else {
            console.log('team_tournament columns:', ttData.length > 0 ? Object.keys(ttData[0]) : 'exists but empty')
        }

        const { data: pttData, error: pttError } = await supabase.from('player_team_tournament').select('*').limit(1)
        if (pttError) {
            console.log('player_team_tournament table error:', pttError.message)
        } else {
            console.log('player_team_tournament columns:', pttData.length > 0 ? Object.keys(pttData[0]) : 'exists but empty')
        }
    } catch (e) {
        console.error('Execution error:', e)
    }
}

checkSchema()
