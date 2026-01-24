import { GameState, GameStore, Phase, Player } from '../types';
import { supabase } from './supabaseClient';

// Helper to generate random room code (4 alphabets)
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Mappers to convert between snake_case DB fields and camelCase TS objects

const mapDbToPlayer = (row: any): Player => ({
  id: row.id,
  name: row.name,
  isHost: row.is_host,
  isImpostor: row.is_impostor,
  description: row.description || '',
  votedForId: row.voted_for_id,
  score: row.score,
  isReady: row.is_ready
});

const mapPlayerToDb = (player: Player, roomCode: string) => ({
  id: player.id,
  room_code: roomCode,
  name: player.name,
  is_host: player.isHost,
  is_impostor: player.isImpostor,
  description: player.description,
  voted_for_id: player.votedForId,
  score: player.score,
  is_ready: player.isReady
});

const mapDbToGame = (gameRow: any, playerRows: any[]): GameState => ({
  roomCode: gameRow.room_code,
  phase: gameRow.phase as Phase,
  secretWord: gameRow.secret_word || '',
  impostorWord: gameRow.impostor_word || '',
  turnIndex: gameRow.turn_index,
  settings: gameRow.settings || { impostorCount: 1, timerSeconds: 30, offlineMode: false },
  winner: gameRow.winner,
  players: playerRows.map(mapDbToPlayer)
});

export const gameService: GameStore = {
  createGame: async (hostName: string) => {
    const roomCode = generateRoomCode();
    const hostId = crypto.randomUUID();

    // 1. Create Game
    const gameData = {
      room_code: roomCode,
      phase: Phase.LOBBY,
      secret_word: '',
      impostor_word: '',
      turn_index: 0,
      settings: { impostorCount: 1, timerSeconds: 30, offlineMode: false },
      winner: null
    };

    const { error: gameError } = await supabase.from('games').insert(gameData);
    if (gameError) throw new Error(gameError.message);

    // 2. Create Host Player
    const playerData = {
      id: hostId,
      room_code: roomCode,
      name: hostName,
      is_host: true,
      is_impostor: false,
      score: 0,
      is_ready: false
    };

    const { error: playerError } = await supabase.from('players').insert(playerData);
    if (playerError) throw new Error(playerError.message);

    // Return initial state
    return {
      roomCode: gameData.room_code,
      phase: gameData.phase,
      secretWord: '',
      impostorWord: '',
      turnIndex: 0,
      settings: gameData.settings,
      winner: null,
      players: [mapDbToPlayer(playerData)]
    };
  },

  joinGame: async (roomCode: string, playerName: string) => {
    // 1. Fetch Game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (gameError || !game) return null;
    if (game.phase !== Phase.LOBBY) return null;

    // 2. Check if player exists or create new
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode);

    const existingPlayer = existingPlayers?.find(p => p.name === playerName);
    
    if (!existingPlayer) {
       // Insert new player
       const newPlayer = {
         id: crypto.randomUUID(),
         room_code: roomCode,
         name: playerName,
         is_host: false,
         is_impostor: false,
         is_ready: false
       };
       await supabase.from('players').insert(newPlayer);
    }

    // Return full game state
    return await gameService.getGame(roomCode);
  },

  getGame: async (roomCode: string) => {
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (!game) return null;

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode);

    return mapDbToGame(game, players || []);
  },

  updateGame: async (roomCode: string, updates: Partial<GameState>) => {
    const gameUpdates: any = {};
    if (updates.phase) gameUpdates.phase = updates.phase;
    if (updates.secretWord !== undefined) gameUpdates.secret_word = updates.secretWord;
    if (updates.impostorWord !== undefined) gameUpdates.impostor_word = updates.impostorWord;
    if (updates.turnIndex !== undefined) gameUpdates.turn_index = updates.turnIndex;
    if (updates.settings) gameUpdates.settings = updates.settings;
    if (updates.winner !== undefined) gameUpdates.winner = updates.winner;

    const promises = [];

    // Update Game Table
    if (Object.keys(gameUpdates).length > 0) {
      promises.push(
        supabase.from('games').update(gameUpdates).eq('room_code', roomCode)
      );
    }

    // Update Players Table (Upsert)
    if (updates.players && updates.players.length > 0) {
      const dbPlayers = updates.players.map(p => mapPlayerToDb(p, roomCode));
      // Supabase upsert
      promises.push(
        supabase.from('players').upsert(dbPlayers)
      );
    }

    await Promise.all(promises);
  },

  transferHost: async (roomCode: string, newHostId: string) => {
    // 1. Get current players
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('room_code', roomCode);

    if (!players) return;

    // 2. Set all to is_host = false, then new host to true
    const updates = players.map(p => ({
      ...p,
      is_host: p.id === newHostId
    }));

    await supabase.from('players').upsert(updates);
  },

  subscribe: (roomCode: string, callback: (game: GameState) => void) => {
    const fetchAndCallback = async () => {
      const game = await gameService.getGame(roomCode);
      if (game) callback(game);
    };

    const channel = supabase
      .channel(`game:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `room_code=eq.${roomCode}`
        },
        () => fetchAndCallback()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_code=eq.${roomCode}`
        },
        () => fetchAndCallback()
      )
      .subscribe();

    fetchAndCallback();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};