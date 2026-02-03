import { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext()

export const useData = () => {
    return useContext(DataContext)
}

export const DataProvider = ({ children }) => {
    // Initialize from localStorage or empty arrays
    const [tournaments, setTournaments] = useState(() => {
        const saved = localStorage.getItem('tournaments')
        return saved ? JSON.parse(saved) : []
    })

    const [teams, setTeams] = useState(() => {
        const saved = localStorage.getItem('teams')
        return saved ? JSON.parse(saved) : []
    })

    const [players, setPlayers] = useState(() => {
        const saved = localStorage.getItem('players')
        return saved ? JSON.parse(saved) : []
    })

    const [games, setGames] = useState(() => {
        const saved = localStorage.getItem('games')
        return saved ? JSON.parse(saved) : []
    })

    // Persist to localStorage whenever data changes
    useEffect(() => { localStorage.setItem('tournaments', JSON.stringify(tournaments)) }, [tournaments])
    useEffect(() => { localStorage.setItem('teams', JSON.stringify(teams)) }, [teams])
    useEffect(() => { localStorage.setItem('players', JSON.stringify(players)) }, [players])
    useEffect(() => { localStorage.setItem('games', JSON.stringify(games)) }, [games])

    // Actions
    // Use functional updates to avoid closure staleness issues (e.g. inside loops)

    const addTournament = (data) => setTournaments(prev => [...prev, { id: Date.now(), ...data }])
    const updateTournament = (id, data) => setTournaments(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    const deleteTournament = (id) => setTournaments(prev => prev.filter(t => t.id !== id))

    const addTeam = (data) => setTeams(prev => [...prev, { id: Date.now(), ...data }])
    const updateTeam = (id, data) => setTeams(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    const deleteTeam = (id) => setTeams(prev => prev.filter(t => t.id !== id))

    const addPlayer = (data) => setPlayers(prev => [...prev, { id: Date.now(), ...data }])

    // Bulk add to ensure atomic update and unique IDs in loop
    const addPlayers = (playersData) => {
        const baseId = Date.now()
        const newPlayers = playersData.map((p, index) => ({
            id: baseId + index,
            ...p
        }))
        setPlayers(prev => [...prev, ...newPlayers])
    }

    const updatePlayer = (id, data) => setPlayers(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    const deletePlayer = (id) => setPlayers(prev => prev.filter(t => t.id !== id))

    const addGame = (data) => setGames(prev => [...prev, { id: Date.now(), ...data }])
    const updateGame = (id, data) => setGames(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    const deleteGame = (id) => setGames(prev => prev.filter(t => t.id !== id))

    const value = {
        tournaments, addTournament, updateTournament, deleteTournament,
        teams, addTeam, updateTeam, deleteTeam,
        players, addPlayer, addPlayers, updatePlayer, deletePlayer,
        games, addGame, updateGame, deleteGame
    }

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}
