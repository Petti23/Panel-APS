import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import {
    fetchTournaments, insertTournament, updateTournament as dbUpdateTournament,
    deleteTournament as dbDeleteTournament,
} from '../services/db/tournaments'
import {
    fetchTeams, insertTeam, updateTeam as dbUpdateTeam,
    deleteTeam as dbDeleteTeam,
} from '../services/db/teams'
import {
    fetchPlayers, insertPlayer, updatePlayer as dbUpdatePlayer,
    deletePlayer as dbDeletePlayer, findOrCreatePlayer
} from '../services/db/players'
import {
    fetchGames, insertGame, updateGame as dbUpdateGame,
    deleteGame as dbDeleteGame,
} from '../services/db/games'
import {
    addTeamToTournament as dbAddTeamToTournament,
    addPlayersToTournamentTeam as dbAddPlayersToTournamentTeam,
    fetchTournamentTeams
} from '../services/db/tournamentTeams'
import { importScheduleToDb } from '../services/db/scheduleImport'
import { fetchCategories } from '../services/db/categories'
import { normalizeText } from '../utils/schedule/normalizeText'

const DataContext = createContext()

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext)

export const DataProvider = ({ children }) => {
    const [categories, setCategories] = useState([])
    const [tournaments, setTournaments] = useState([])
    const [teams, setTeams] = useState([])
    const [players, setPlayers] = useState([])
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const [dbError, setDbError] = useState(null)

    // ── Carga inicial desde Supabase ──────────────────────────────
    const loadAll = useCallback(async () => {
        setLoading(true)
        try {
            const [cats, t, tm, p, g] = await Promise.all([
                fetchCategories(),
                fetchTournaments(),
                fetchTeams(),
                fetchPlayers(),
                fetchGames(),
            ])
            setCategories(cats)
            setTournaments(t)
            setTeams(tm)
            setPlayers(p)
            setGames(g)
            setDbError(null)
        } catch (err) {
            console.error('Error cargando datos desde Supabase:', err)
            setDbError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadAll() }, [loadAll])

    // ── Torneos ───────────────────────────────────────────────────
    const addTournament = (data) => {
        const tempId = `tmp_${Date.now()}`
        setTournaments((prev) => [...prev, { id: tempId, ...data }])
        insertTournament(data)
            .then((created) => setTournaments((prev) => prev.map((t) => t.id === tempId ? created : t)))
            .catch((err) => {
                console.error('Error creando torneo:', err)
                setTournaments((prev) => prev.filter((t) => t.id !== tempId))
            })
    }

    const addTournaments = (items) => {
        const base = Date.now()
        const tmpItems = items.map((t, i) => ({ id: `tmp_${base + i}`, ...t }))
        setTournaments((prev) => [...prev, ...tmpItems])
        Promise.all(items.map(insertTournament))
            .then((created) => setTournaments((prev) => {
                const without = prev.filter((t) => !tmpItems.some((o) => o.id === t.id))
                return [...without, ...created]
            }))
            .catch((err) => {
                console.error('Error creando torneos:', err)
                setTournaments((prev) => prev.filter((t) => !tmpItems.some((o) => o.id === t.id)))
            })
    }

    const updateTournament = (id, data) => {
        const snapshot = tournaments
        setTournaments((list) => list.map((t) => t.id === id ? { ...t, ...data } : t))
        dbUpdateTournament(id, data).catch((err) => {
            console.error('Error actualizando torneo:', err)
            setTournaments(snapshot)
        })
    }

    const deleteTournament = (id) => {
        const snapshot = tournaments
        setTournaments((list) => list.filter((t) => t.id !== id))
        dbDeleteTournament(id).catch((err) => {
            console.error('Error eliminando torneo:', err)
            setTournaments(snapshot)
        })
    }

    // ── Equipos ───────────────────────────────────────────────────
    const addTeam = (data) => {
        const tempId = `tmp_${Date.now()}`
        setTeams((prev) => [...prev, { id: tempId, ...data }])
        insertTeam(data)
            .then((created) => setTeams((prev) => prev.map((t) => t.id === tempId ? created : t)))
            .catch((err) => {
                console.error('Error creando equipo:', err)
                setTeams((prev) => prev.filter((t) => t.id !== tempId))
                alert(err.message || 'Error creando equipo')
            })
    }

    const addTeams = (items) => {
        const base = Date.now()
        const tmpItems = items.map((t, i) => ({ id: `tmp_${base + i}`, ...t }))
        setTeams((prev) => [...prev, ...tmpItems])
        Promise.all(items.map(insertTeam))
            .then((created) => setTeams((prev) => {
                const without = prev.filter((t) => !tmpItems.some((o) => o.id === t.id))
                return [...without, ...created]
            }))
            .catch((err) => {
                console.error('Error creando equipos:', err)
                setTeams((prev) => prev.filter((t) => !tmpItems.some((o) => o.id === t.id)))
            })
    }

    const updateTeam = (id, data) => {
        const snapshot = teams
        setTeams((list) => list.map((t) => t.id === id ? { ...t, ...data } : t))
        dbUpdateTeam(id, data).catch((err) => {
            console.error('Error actualizando equipo:', err)
            setTeams(snapshot)
            alert(err.message || 'Error actualizando equipo')
        })
    }

    const deleteTeam = (id) => {
        const snapshot = teams
        setTeams((list) => list.filter((t) => t.id !== id))
        dbDeleteTeam(id).catch((err) => {
            console.error('Error eliminando equipo:', err)
            setTeams(snapshot)
        })
    }

    // ── Jugadores ─────────────────────────────────────────────────
    const addPlayer = (data) => {
        const tempId = `tmp_${Date.now()}`
        setPlayers((prev) => [...prev, { id: tempId, ...data }])
        insertPlayer(data)
            .then((created) => setPlayers((prev) => prev.map((p) => p.id === tempId ? created : p)))
            .catch((err) => {
                console.error('Error creando jugador:', err)
                setPlayers((prev) => prev.filter((p) => p.id !== tempId))
            })
    }

    const addPlayers = (items) => {
        const base = Date.now()
        const tmpItems = items.map((p, i) => ({ id: `tmp_${base + i}`, ...p }))
        setPlayers((prev) => [...prev, ...tmpItems])
        Promise.all(items.map(insertPlayer))
            .then((created) => setPlayers((prev) => {
                const without = prev.filter((p) => !tmpItems.some((o) => o.id === p.id))
                return [...without, ...created]
            }))
            .catch((err) => {
                console.error('Error creando jugadores:', err)
                setPlayers((prev) => prev.filter((p) => !tmpItems.some((o) => o.id === p.id)))
            })
    }

    const updatePlayer = (id, data) => {
        const snapshot = players
        setPlayers((list) => list.map((p) => p.id === id ? { ...p, ...data } : p))
        dbUpdatePlayer(id, data).catch((err) => {
            console.error('Error actualizando jugador:', err)
            setPlayers(snapshot)
        })
    }

    const deletePlayer = (id) => {
        const snapshot = players
        setPlayers((list) => list.filter((p) => p.id !== id))
        dbDeletePlayer(id).catch((err) => {
            console.error('Error eliminando jugador:', err)
            setPlayers(snapshot)
        })
    }

    // ── Partidos ──────────────────────────────────────────────────
    const addGame = (data) => {
        const tempId = `tmp_${Date.now()}`
        setGames((prev) => [...prev, { id: tempId, ...data }])
        insertGame(data)
            .then((created) => setGames((prev) => prev.map((g) => g.id === tempId ? created : g)))
            .catch((err) => {
                console.error('Error creando partido:', err)
                setGames((prev) => prev.filter((g) => g.id !== tempId))
            })
    }

    const addGames = (items) => {
        const base = Date.now()
        const tmpItems = items.map((g, i) => ({ id: `tmp_${base + i}`, ...g }))
        setGames((prev) => [...prev, ...tmpItems])
        Promise.all(items.map(insertGame))
            .then((created) => setGames((prev) => {
                const without = prev.filter((g) => !tmpItems.some((o) => o.id === g.id))
                return [...without, ...created]
            }))
            .catch((err) => {
                console.error('Error creando partidos:', err)
                setGames((prev) => prev.filter((g) => !tmpItems.some((o) => o.id === g.id)))
            })
    }

    const updateGame = (id, data) => {
        const snapshot = games
        setGames((list) => list.map((g) => g.id === id ? { ...g, ...data } : g))
        dbUpdateGame(id, data).catch((err) => {
            console.error('Error actualizando partido:', err)
            setGames(snapshot)
        })
    }

    const deleteGame = (id) => {
        const snapshot = games
        setGames((list) => list.filter((g) => g.id !== id))
        dbDeleteGame(id).catch((err) => {
            console.error('Error eliminando partido:', err)
            setGames(snapshot)
        })
    }

    // ── Relaciones Torneo-Equipo ──────────────────────────────────
    const addTeamToTournament = async (tournamentId, teamId, playerIds = []) => {
        try {
            await dbAddTeamToTournament(tournamentId, teamId)
            if (playerIds.length > 0) {
                await dbAddPlayersToTournamentTeam(tournamentId, teamId, playerIds)
            }
        } catch (err) {
            console.error('Error vinculando equipo al torneo:', err)
            throw err
        }
    }

    const processRoster = async (tournamentId, teamId, playersData) => {
        try {
            // Aseguramos que el equipo esté vinculado al torneo
            await dbAddTeamToTournament(tournamentId, teamId).catch(err => {
                // Si ya existe, lo ignoramos (error 23505)
                if (err.code !== '23505') throw err
            })

            const playerIds = []
            for (const pData of playersData) {
                const player = await findOrCreatePlayer(pData)
                playerIds.push(player.id)
            }

            if (playerIds.length > 0) {
                await dbAddPlayersToTournamentTeam(tournamentId, teamId, playerIds)
            }

            // Refrescamos jugadores locales por si hubo nuevos
            await loadAll()
        } catch (err) {
            console.error('Error procesando roster:', err)
            throw err
        }
    }

    const importTournamentSchedule = async (tournamentId, scheduleRows) => {
        try {
            // 1. Obtener nombres de equipos únicos desde el Excel
            const teamNamesFromExcel = new Set()
            scheduleRows.forEach(row => {
                teamNamesFromExcel.add(row.homeTeam)
                teamNamesFromExcel.add(row.awayTeam)
            })

            // 2. Obtener todos los equipos actuales de la DB para comparar localmente
            const { data: allTeams, error: fetchErr } = await supabase
                .from('team')
                .select('team_id, name')
            if (fetchErr) throw fetchErr

            const teamIdMap = new Map()
            const existingTeamsMap = new Map(allTeams.map(t => [normalizeText(t.name), t.team_id]))

            for (const name of teamNamesFromExcel) {
                const normalizedName = normalizeText(name)
                let teamId = existingTeamsMap.get(normalizedName)
                
                if (!teamId) {
                    // No existe, lo creamos
                    const { data: inserted, error: insErr } = await supabase
                        .from('team')
                        .insert({ name })
                        .select()
                        .single()
                    if (insErr) throw insErr
                    teamId = inserted.team_id
                    // Actualizamos el mapa local por si se repite en el mismo Excel
                    existingTeamsMap.set(normalizedName, teamId)
                }
                
                teamIdMap.set(normalizedName, teamId)

                // 3. Asegurar que estén vinculados al torneo (team_tournament)
                await dbAddTeamToTournament(tournamentId, teamId).catch(err => {
                    // Si ya está vinculado (23505 = unique_violation), lo ignoramos
                    if (err.code !== '23505') throw err
                })
            }

            // 4. Crear los partidos
            const gameRows = scheduleRows.map(row => {
                const home_team_id = teamIdMap.get(normalizeText(row.homeTeam))
                const away_team_id = teamIdMap.get(normalizeText(row.awayTeam))
                const scheduled_datetime = row.time
                    ? `${row.date}T${row.time}:00`
                    : `${row.date}T00:00:00`
                
                return {
                    tournament_id: tournamentId,
                    home_team_id,
                    away_team_id,
                    field: row.field,
                    scheduled_datetime
                }
            })

            const { data: insertedGames, error } = await supabase
                .from('game')
                .insert(gameRows)
                .select()
            
            if (error) throw error

            await loadAll()
            return insertedGames.length
        } catch (err) {
            console.error('Error importando fixture:', err)
            throw err
        }
    }

    // ── Importación masiva desde Excel ────────────────────────────
    const importScheduleData = async (data) => {
        const result = await importScheduleToDb(data)
        // Refrescar todo desde DB para tener UUIDs reales y datos limpios
        await loadAll()
        return result
    }

    const value = {
        loading,
        dbError,
        categories,
        tournaments, addTournament, addTournaments, updateTournament, deleteTournament,
        teams, addTeam, addTeams, updateTeam, deleteTeam,
        players, addPlayer, addPlayers, updatePlayer, deletePlayer,
        games, addGame, addGames, updateGame, deleteGame,
        addTeamToTournament, processRoster, fetchTournamentTeams,
        importScheduleData, importTournamentSchedule,
    }

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}
