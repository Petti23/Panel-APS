import { supabase } from '../supabase'

/**
 * Agrega un equipo a un torneo (team_tournament)
 */
export const addTeamToTournament = async (tournamentId, teamId, zone = null, seed = null) => {
    const { data, error } = await supabase
        .from('team_tournament')
        .insert({
            tournament_id: tournamentId,
            team_id: teamId,
            zone,
            seed
        })
        .select()
        .single()
    if (error) throw error
    return data
}

/**
 * Agrega jugadores a un equipo dentro de un torneo (player_team_tournament)
 */
export const addPlayersToTournamentTeam = async (tournamentId, teamId, playerIds) => {
    const rows = playerIds.map(playerId => ({
        tournament_id: tournamentId,
        team_id: teamId,
        player_id: playerId,
        active: true
    }))

    const { data, error } = await supabase
        .from('player_team_tournament')
        .insert(rows)
        .select()
    if (error) throw error
    return data
}

/**
 * Obtiene los equipos de un torneo
 */
export const fetchTournamentTeams = async (tournamentId) => {
    const { data, error } = await supabase
        .from('team_tournament')
        .select('*, team(*)')
        .eq('tournament_id', tournamentId)
    if (error) throw error
    return data
}
