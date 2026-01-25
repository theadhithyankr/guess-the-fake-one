export enum Phase {
  HOME = 'HOME',
  LOBBY = 'LOBBY',
  REVEAL = 'REVEAL',
  DESCRIBING = 'DESCRIBING',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS',
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isImpostor: boolean;
  description: string;
  votedForId: string | null;
  score: number;
  isReady: boolean; // For reveal phase
}

export interface GameState {
  roomCode: string;
  phase: Phase;
  players: Player[];
  secretWord: string;
  impostorWord: string;
  turnIndex: number;
  settings: {
    impostorCount: number;
    timerSeconds: number;
    offlineMode: boolean;
  };
  winner: 'IMPOSTOR' | 'CREW' | null;
}

export interface GameStore {
  createGame: (hostName: string, userId?: string) => Promise<GameState>;
  joinGame: (roomCode: string, playerName: string, userId?: string) => Promise<GameState | null>;
  resumeGame: (userId: string) => Promise<GameState | null>;
  getGame: (roomCode: string) => Promise<GameState | null>;
  updateGame: (roomCode: string, updates: Partial<GameState>) => Promise<void>;
  subscribe: (roomCode: string, callback: (game: GameState) => void) => () => void;
  transferHost: (roomCode: string, newHostId: string) => Promise<void>;
}