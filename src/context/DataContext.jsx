import { createContext, useContext, useState, useEffect } from 'react'
import { normalizeText } from '../utils/schedule/normalizeText'
import { parseDateToISO } from '../utils/schedule/parseDate'

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
    const addTournaments = (tournamentsData) => {
        const baseId = Date.now();
        setTournaments(prev => [
            ...prev,
            ...tournamentsData.map((t, i) => ({ id: baseId + i, ...t }))
        ]);
    };
    const updateTournament = (id, data) => setTournaments(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    const deleteTournament = (id) => setTournaments(prev => prev.filter(t => t.id !== id))

    const addTeam = (data) => setTeams(prev => [...prev, { id: Date.now(), ...data }])
    const addTeams = (teamsData) => {
        const baseId = Date.now();
        setTeams(prev => [
            ...prev,
            ...teamsData.map((t, i) => ({ id: baseId + i, ...t }))
        ]);
    };
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
    const addGames = (gamesData) => {
        const baseId = Date.now();
        setGames(prev => [
            ...prev,
            ...gamesData.map((g, i) => ({ id: baseId + i, ...g }))
        ]);
    };
    const updateGame = (id, data) => setGames(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    const deleteGame = (id) => setGames(prev => prev.filter(t => t.id !== id))

    const importScheduleData = (data) => {
        let currentTournaments = [...tournaments];
        let currentTeams = [...teams];
        let currentGames = [...games];
        const baseId = Date.now();
        let counter = 0;

        data.categorias.forEach(cat => {
            if (cat.estado !== 'con_partidos' || cat.partidos.length === 0) return;

            const normCat = normalizeText(cat.categoria);
            let tournament = currentTournaments.find(t => normalizeText(t.category) === normCat);

            if (!tournament) {
                const tournamentName = `${cat.categoria} ${cat.torneo || ''} ${cat.anio || ''}`.trim();
                tournament = { 
                    id: baseId + (counter++), 
                    name: tournamentName, 
                    category: cat.categoria 
                };
                currentTournaments.push(tournament);
            }

            cat.partidos.forEach(p => {
                const normNameL = normalizeText(p.local);
                let homeTeam = currentTeams.find(t => normalizeText(t.name) === normNameL && normalizeText(t.category) === normCat);
                if (!homeTeam) {
                    homeTeam = { 
                        id: baseId + (counter++), 
                        name: p.local, 
                        category: cat.categoria 
                    };
                    currentTeams.push(homeTeam);
                }

                const normNameV = normalizeText(p.visitante);
                let visitorTeam = currentTeams.find(t => normalizeText(t.name) === normNameV && normalizeText(t.category) === normCat);
                if (!visitorTeam) {
                    visitorTeam = { 
                        id: baseId + (counter++), 
                        name: p.visitante, 
                        category: cat.categoria 
                    };
                    currentTeams.push(visitorTeam);
                }

                const gameDate = parseDateToISO(p.fechaTexto);
                
                const isDuplicate = currentGames.some(g => 
                    g.tournamentId == tournament.id && 
                    g.homeTeamId == homeTeam.id && 
                    g.visitorTeamId == visitorTeam.id && 
                    g.date === gameDate && 
                    g.time === p.hora
                );

                if (!isDuplicate) {
                    currentGames.push({
                        id: baseId + (counter++),
                        tournamentId: tournament.id,
                        homeTeamId: homeTeam.id,
                        visitorTeamId: visitorTeam.id,
                        field: p.diamante || 'A confirmar',
                        date: gameDate,
                        time: p.hora
                    });
                }
            });
        });

        setTournaments(currentTournaments);
        setTeams(currentTeams);
        setGames(currentGames);
        
        return {
            addedTournaments: currentTournaments.length - tournaments.length,
            addedTeams: currentTeams.length - teams.length,
            addedGames: currentGames.length - games.length
        };
    };

    const value = {
        tournaments, addTournament, addTournaments, updateTournament, deleteTournament,
        teams, addTeam, addTeams, updateTeam, deleteTeam,
        players, addPlayer, addPlayers, updatePlayer, deletePlayer,
        games, addGame, addGames, updateGame, deleteGame,
        importScheduleData
    }

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}
