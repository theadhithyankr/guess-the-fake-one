import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { gameService } from './services/gameService';
import { supabase } from './services/supabaseClient';
import { GameState, Phase, Player } from './types';
import { Button } from './components/Button';
import { Session } from '@supabase/supabase-js';

// Icons
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const CrownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const MegaphoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const SwapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const FingerPrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.131A8 8 0 008 2.855C3.081 2.855 0 5.714 0 10c0 1.992.516 3.89 1.461 5.652L3.212 14" /></svg>;
const GoogleIcon = () => <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;

// Helper for deterministic color
const getAvatarColor = (name: string) => {
  const colors = [
    'from-red-500 to-orange-600',
    'from-blue-500 to-cyan-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-pink-600',
    'from-yellow-500 to-orange-600', 
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-green-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const App = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [localPlayer, setLocalPlayer] = useState<{ name: string, id: string } | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  // UI State
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const [manualImpostorIds, setManualImpostorIds] = useState<Set<string>>(new Set());

  // Form States
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [hostSecretWord, setHostSecretWord] = useState('');
  const [hostImpostorWord, setHostImpostorWord] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Host Settings
  const [impostorCount, setImpostorCount] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Auth & Rejoin Logic
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      handleSessionFound(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Only auto-update name if we are not already in a game
      if (session?.user && !gameState) {
        setPlayerName(session.user.user_metadata.full_name || '');
      }
    });

    return () => subscription.unsubscribe();
  }, [gameState]);

  const handleSessionFound = async (session: Session | null) => {
    setIsCheckingSession(true);
    if (session?.user) {
      setPlayerName(session.user.user_metadata.full_name || '');
      try {
        // Attempt to auto-rejoin
        const game = await gameService.resumeGame(session.user.id);
        if (game) {
          const me = game.players.find(p => p.id === session.user.id);
          if (me) {
             setLocalPlayer({ name: me.name, id: me.id });
             setGameState(game);
          }
        }
      } catch (e) {
        console.error("Auto-rejoin failed", e);
      }
    }
    setIsCheckingSession(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    } catch (e: any) {
      setErrorMsg(e.message || "Login failed");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setGameState(null);
    setLocalPlayer(null);
  };

  // Subscribe to game updates
  useEffect(() => {
    if (gameState?.roomCode) {
      const unsubscribe = gameService.subscribe(gameState.roomCode, (updatedGame) => {
        setGameState(updatedGame);
        // Sync settings for non-hosts
        setImpostorCount(updatedGame.settings.impostorCount);
        setTimerSeconds(updatedGame.settings.timerSeconds);
        setIsOfflineMode(updatedGame.settings.offlineMode);
      });
      return unsubscribe;
    }
  }, [gameState?.roomCode]);

  // Reset local vote selection on phase change
  useEffect(() => {
    if (gameState?.phase !== Phase.VOTING) {
      setSelectedVoteId(null);
    }
  }, [gameState?.phase]);

  // Actions
  const handleCreateGame = async () => {
    if (!playerName.trim()) return setErrorMsg('Please enter your name');
    setIsLoading(true);
    try {
      const userId = session?.user?.id;
      const newGame = await gameService.createGame(playerName, userId);
      // If we are logged in, we use our Auth ID. If guest, we use the ID returned by createGame service
      // But wait, createGame returns the state. The player[0] is the host.
      const myPlayer = newGame.players.find(p => p.isHost); 
      if (myPlayer) {
          setLocalPlayer({ name: playerName, id: myPlayer.id });
          setGameState(newGame);
          setErrorMsg('');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to create game. Check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) return setErrorMsg('Please enter your name');
    if (!roomCodeInput.trim()) return setErrorMsg('Please enter a room code');
    
    setIsLoading(true);
    try {
      const userId = session?.user?.id;
      const game = await gameService.joinGame(roomCodeInput.toUpperCase(), playerName, userId);
      if (!game) {
        setErrorMsg('Room not found or game locked');
      } else {
        // Find my player
        let myPlayer;
        if (userId) {
             myPlayer = game.players.find(p => p.id === userId);
        } else {
             // Guest: Find by name (last matching)
             // This is imperfect for guests with duplicate names but fine for MVP
             myPlayer = [...game.players].reverse().find(p => p.name === playerName);
        }

        if (myPlayer) {
          setLocalPlayer({ name: playerName, id: myPlayer.id });
          setGameState(game);
          setErrorMsg('');
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to join game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferHost = async (newHostId: string) => {
    if (!gameState) return;
    try {
      await gameService.transferHost(gameState.roomCode, newHostId);
    } catch (e) {
      console.error("Failed to transfer host", e);
    }
  };

  const toggleManualImpostor = (playerId: string) => {
    setManualImpostorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const handleStartGame = async () => {
    if (!gameState) return;
    if (!hostSecretWord.trim() || !hostImpostorWord.trim()) {
      return setErrorMsg('Please enter both words');
    }

    const playingPlayers = gameState.players.filter(p => !p.isHost);
    if (playingPlayers.length < 2) {
      return setErrorMsg('Need at least 2 players (excluding Host) to start');
    }

    // 1. Assign Impostors
    let updatedPlayers = [...gameState.players];
    const playingIndices = updatedPlayers
      .map((p, idx) => ({ ...p, originalIdx: idx }))
      .filter(p => !p.isHost);

    let finalImpostorIds = new Set<string>();

    if (manualImpostorIds.size > 0) {
      // Use manual selection
      finalImpostorIds = manualImpostorIds;
    } else {
      // Random selection among PLAYERS (not host)
      const indices = Array.from({ length: playingIndices.length }, (_, i) => i);
      // Shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      // Pick first N
      const selectedIndices = indices.slice(0, impostorCount);
      selectedIndices.forEach(idx => {
         finalImpostorIds.add(playingIndices[idx].id);
      });
    }

    updatedPlayers = updatedPlayers.map(p => ({
      ...p,
      isImpostor: finalImpostorIds.has(p.id),
      isReady: false,
      description: '',
      votedForId: null
    }));

    // Find the starting turn index (first non-host player)
    const firstPlayerIndex = updatedPlayers.findIndex(p => !p.isHost);

    // 2. Update Game State
    await gameService.updateGame(gameState.roomCode, {
      players: updatedPlayers,
      secretWord: hostSecretWord,
      impostorWord: hostImpostorWord,
      phase: Phase.REVEAL,
      turnIndex: firstPlayerIndex >= 0 ? firstPlayerIndex : 0,
      settings: {
        impostorCount,
        timerSeconds,
        offlineMode: isOfflineMode
      }
    });
  };

  const handleReady = async () => {
    if (!gameState || !localPlayer) return;
    
    // Host doesn't need to ready up if they aren't playing
    const isHost = gameState.players.find(p => p.id === localPlayer.id)?.isHost;
    if (isHost) return;

    const updatedPlayers = gameState.players.map(p => 
      p.id === localPlayer.id ? { ...p, isReady: true } : p
    );
    
    // Check if all non-host players ready
    const playingPlayers = updatedPlayers.filter(p => !p.isHost);
    const allReady = playingPlayers.every(p => p.isReady);
    
    await gameService.updateGame(gameState.roomCode, {
      players: updatedPlayers,
      phase: allReady ? Phase.DESCRIBING : gameState.phase
    });
  };

  const handleOfflineEndGame = async () => {
    if (!gameState) return;
    await gameService.updateGame(gameState.roomCode, {
      phase: Phase.RESULTS,
      // No winner calculation, just show roles
      winner: null 
    });
  }

  const handleSubmitDescription = async () => {
    if (!gameState || !localPlayer || !descriptionText.trim()) return;
    
    const updatedPlayers = gameState.players.map(p => 
      p.id === localPlayer.id ? { ...p, description: descriptionText } : p
    );

    // Find next player who is NOT the host
    let nextTurnIndex = gameState.turnIndex + 1;
    let loopCount = 0;
    
    // Loop until we find a valid player or exhaust list
    while (loopCount < gameState.players.length) {
       // Check boundary FIRST
       if (nextTurnIndex >= gameState.players.length) {
          // Round over
          break;
       }
       const nextPlayer = gameState.players[nextTurnIndex];
       if (nextPlayer.isHost) {
         nextTurnIndex++;
       } else {
         break;
       }
       loopCount++;
    }

    // Double check round over condition: if we skipped the host and went out of bounds
    const isRoundOver = nextTurnIndex >= gameState.players.length;

    await gameService.updateGame(gameState.roomCode, {
      players: updatedPlayers,
      turnIndex: nextTurnIndex,
      phase: isRoundOver ? Phase.VOTING : Phase.DESCRIBING
    });
    setDescriptionText('');
  };

  const handleConfirmVote = async () => {
    if (!gameState || !localPlayer || !selectedVoteId) return;
    
    // 1. Update local vote
    const updatedPlayers = gameState.players.map(p => 
      p.id === localPlayer.id ? { ...p, votedForId: selectedVoteId } : p
    );

    // 2. Count votes (only from non-hosts)
    const activeVoters = updatedPlayers.filter(p => !p.isHost);
    const voteCounts: Record<string, number> = {};
    let votesCastCount = 0;
    
    activeVoters.forEach(p => {
      if (p.votedForId) {
        voteCounts[p.votedForId] = (voteCounts[p.votedForId] || 0) + 1;
        votesCastCount++;
      }
    });

    const totalVoters = activeVoters.length;
    // Majority rule: > 50%
    const majorityThreshold = Math.floor(totalVoters / 2) + 1;

    let maxVotes = 0;
    let mostVotedPlayerId: string | null = null;
    let isTie = false;

    Object.entries(voteCounts).forEach(([pid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedPlayerId = pid;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    const hasMajority = maxVotes >= majorityThreshold;
    const allVoted = votesCastCount === totalVoters;

    let winner: 'IMPOSTOR' | 'CREW' | null = null;
    let nextPhase = Phase.VOTING;

    if (hasMajority || allVoted) {
      nextPhase = Phase.RESULTS;
      const impostors = updatedPlayers.filter(p => p.isImpostor);
      const impostorIds = new Set(impostors.map(p => p.id));
      
      if (!isTie && mostVotedPlayerId && impostorIds.has(mostVotedPlayerId)) {
        winner = 'CREW';
      } else {
        winner = 'IMPOSTOR';
      }
    }

    await gameService.updateGame(gameState.roomCode, {
      players: updatedPlayers,
      phase: nextPhase,
      winner: winner
    });
    setSelectedVoteId(null);
  };

  const handleReset = async () => {
    if (!gameState) return;
    await gameService.updateGame(gameState.roomCode, {
      phase: Phase.LOBBY,
      players: gameState.players.map(p => ({ 
        ...p, 
        isImpostor: false, 
        isReady: false, 
        description: '', 
        votedForId: null 
      })),
      secretWord: '',
      impostorWord: '',
      turnIndex: 0,
      winner: null
    });
    setHostSecretWord('');
    setHostImpostorWord('');
    setManualImpostorIds(new Set());
  };

  // --- Views ---

  if (isCheckingSession) {
     return <div className="min-h-screen bg-black flex items-center justify-center text-neutral-500">Loading...</div>;
  }

  if (!gameState || !localPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="max-w-md w-full space-y-8 bg-neutral-900 p-8 rounded-2xl shadow-2xl border border-neutral-800 relative">
          
          {/* Auth Header */}
          <div className="absolute top-4 right-4">
             {session?.user ? (
               <div className="flex items-center gap-2">
                 {session.user.user_metadata.avatar_url && (
                   <img src={session.user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-neutral-700" alt="avatar"/>
                 )}
                 <button onClick={handleSignOut} className="text-xs text-neutral-500 hover:text-white underline">Sign Out</button>
               </div>
             ) : (
                <button onClick={handleGoogleLogin} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
                   Login
                </button>
             )}
          </div>

          <div className="text-center mt-4">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 mb-2">
              Who's the Impostor?
            </h1>
            <p className="text-neutral-400">Join friends and find out who's faking it.</p>
          </div>

          <div className="space-y-4">
            
            {!session && (
              <div className="pb-4 border-b border-neutral-800 mb-4">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors"
                >
                  <GoogleIcon />
                  Sign in with Google
                </button>
                <p className="text-center text-xs text-neutral-600 mt-2">Sign in to re-join active games easily.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition placeholder-neutral-600"
                placeholder="Enter your nickname"
              />
            </div>
            
            <div className="pt-2">
              <Button fullWidth onClick={handleCreateGame} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create New Game'}
              </Button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-neutral-800"></div>
              <span className="flex-shrink-0 mx-4 text-neutral-600 text-sm">OR</span>
              <div className="flex-grow border-t border-neutral-800"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                className="flex-1 bg-black border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition uppercase placeholder-neutral-600 font-mono tracking-widest text-center"
                placeholder="CODE"
              />
              <Button variant="secondary" onClick={handleJoinGame} disabled={isLoading}>
                {isLoading ? '...' : 'Join'}
              </Button>
            </div>
          </div>
          
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-200 text-sm text-center">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isHost = localPlayer.id === gameState.players.find(p => p.isHost)?.id;

  // Derive the Active Player based on Turn Index for correct UI mapping
  const activePlayerId = gameState.players[gameState.turnIndex]?.id;

  return (
    <div className="min-h-screen bg-black pb-10 font-sans text-neutral-100">
      {/* Header */}
      {gameState.phase !== Phase.VOTING && (
        <div className="bg-neutral-900/80 border-b border-neutral-800 p-4 sticky top-0 z-10 backdrop-blur-sm">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
               <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-rose-600">IMPOSTOR</span>
               <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs font-mono text-neutral-400 border border-neutral-700">{gameState.roomCode}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <UserIcon />
              {localPlayer.name}
              {session && (
                 <button onClick={handleSignOut} className="ml-2 text-xs text-neutral-500 border border-neutral-700 px-2 py-0.5 rounded hover:bg-neutral-800">Exit</button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* ... Rest of the Game UI remains identical ... */}
      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* LOBBY PHASE */}
        {gameState.phase === Phase.LOBBY && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                Players <span className="text-sm font-normal text-neutral-400 bg-neutral-800 px-2 rounded-full">{gameState.players.length}</span>
              </h2>
              <div className="space-y-3">
                {gameState.players.map(p => {
                  const isMe = p.id === localPlayer.id;
                  const isGameHost = p.isHost;
                  const isManualImp = manualImpostorIds.has(p.id);
                  
                  return (
                    <div key={p.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all 
                      ${isMe ? 'bg-neutral-800/80 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'bg-black/40 border-neutral-800'}
                      ${isManualImp ? 'border-red-600 bg-red-900/20' : ''}
                      `}
                      onClick={() => isHost && !isGameHost ? toggleManualImpostor(p.id) : null}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(p.name)} p-0.5 shadow-lg relative shrink-0`}>
                           <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center relative overflow-hidden">
                               <span className="text-lg font-black text-white z-10 select-none">{p.name[0].toUpperCase()}</span>
                           </div>
                           {isGameHost && (
                               <div className="absolute -top-1 -right-1 bg-yellow-500 text-yellow-950 rounded-full p-1 shadow-lg border border-neutral-900 flex items-center justify-center">
                                   <CrownIcon />
                               </div>
                           )}
                           {isHost && isManualImp && (
                             <div className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-lg border border-neutral-900 flex items-center justify-center">
                                 <FingerPrintIcon />
                             </div>
                           )}
                        </div>
                        
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold truncate max-w-[120px] ${isMe ? 'text-white text-lg' : 'text-neutral-300'}`}>
                                    {p.name}
                                </span>
                                {isMe && <span className="bg-red-900/50 text-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-800">YOU</span>}
                            </div>
                            <span className="text-xs text-neutral-500">
                                {isGameHost ? 'Game Master' : 'Player'}
                            </span>
                        </div>
                      </div>

                      {isHost && !isGameHost && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             handleTransferHost(p.id);
                           }}
                           className="p-2 text-neutral-500 hover:text-yellow-500 transition-colors"
                           title="Make Host"
                         >
                           <SwapIcon />
                         </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {isHost && (
                <p className="text-xs text-neutral-500 mt-2 text-center italic">
                  Tap a player to manually mark as Impostor
                </p>
              )}
            </div>

            {isHost ? (
               <div className="bg-neutral-900 rounded-xl p-6 border border-red-900/30 shadow-xl ring-1 ring-red-900/20">
                 <h2 className="text-xl font-bold mb-4 text-red-500">Game Setup</h2>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between bg-black p-3 rounded-lg border border-neutral-700">
                     <div>
                       <div className="text-sm font-bold text-white">Offline Mode</div>
                       <div className="text-xs text-neutral-500">Words assigned, but no in-app turns</div>
                     </div>
                     <button 
                       onClick={() => setIsOfflineMode(!isOfflineMode)}
                       className={`w-12 h-6 rounded-full p-1 transition-colors ${isOfflineMode ? 'bg-red-600' : 'bg-neutral-700'}`}
                     >
                       <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOfflineMode ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                   </div>

                   <div>
                     <label className="block text-sm text-neutral-400 mb-1">Secret Word (Crew)</label>
                     <input 
                        type="text" 
                        value={hostSecretWord}
                        onChange={(e) => setHostSecretWord(e.target.value)}
                        placeholder="e.g. Beach"
                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-600 outline-none transition"
                     />
                   </div>
                   <div>
                     <label className="block text-sm text-neutral-400 mb-1">Impostor Word</label>
                     <input 
                        type="text" 
                        value={hostImpostorWord}
                        onChange={(e) => setHostImpostorWord(e.target.value)}
                        placeholder="e.g. Desert"
                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-red-600 outline-none transition"
                     />
                   </div>

                   {!isOfflineMode && (
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm text-neutral-400 mb-1">Impostors</label>
                       <div className="flex gap-2">
                         {[1, 2].map(num => (
                           <button
                             key={num}
                             onClick={() => setImpostorCount(num)}
                             className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                               impostorCount === num 
                               ? 'bg-red-900/40 border-red-600 text-red-100' 
                               : 'bg-black border-neutral-700 text-neutral-500 hover:border-neutral-500'
                             }`}
                           >
                             {num}
                           </button>
                         ))}
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm text-neutral-400 mb-1">Turn Timer</label>
                       <select 
                         value={timerSeconds}
                         onChange={(e) => setTimerSeconds(Number(e.target.value))}
                         className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white text-sm focus:border-red-600 outline-none"
                       >
                         <option value={30}>30s</option>
                         <option value={60}>60s</option>
                         <option value={90}>90s</option>
                         <option value={0}>Unlimited</option>
                       </select>
                     </div>
                   </div>
                   )}
                   
                   {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
                   
                   <Button fullWidth onClick={handleStartGame}>
                     Start Game
                   </Button>
                 </div>
               </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 animate-pulse">
                {isOfflineMode ? 'Host has enabled Offline Mode' : 'Waiting for host to start the game...'}
              </div>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {gameState.phase === Phase.REVEAL && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <h2 className="text-2xl font-bold text-neutral-200">Your Secret Role</h2>
            
            <div className={`relative w-full max-w-sm aspect-[3/4] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-500`}>
               {/* Identity Card Logic */}
               {(() => {
                 const me = gameState.players.find(p => p.id === localPlayer.id);
                 if (me?.isHost) {
                   return (
                     <div className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center border-4 border-yellow-500/50 bg-neutral-900 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                        <CrownIcon />
                        <h1 className="text-3xl font-black text-yellow-500 mt-4 mb-2">GAME MASTER</h1>
                        <p className="text-yellow-200/70 mb-6">You are moderating this game.</p>
                        
                        <div className="w-full bg-black/50 p-4 rounded-lg text-left space-y-2">
                           <div className="flex justify-between text-sm">
                             <span className="text-neutral-500">Secret:</span>
                             <span className="text-blue-400 font-bold">{gameState.secretWord}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-neutral-500">Impostor:</span>
                             <span className="text-red-400 font-bold">{gameState.impostorWord}</span>
                           </div>
                           <div className="pt-2 border-t border-neutral-700">
                             <span className="text-neutral-500 text-xs block mb-1">IMPOSTORS:</span>
                             {gameState.players.filter(p => p.isImpostor).map(p => (
                               <span key={p.id} className="inline-block bg-red-900/50 text-red-200 text-xs px-2 py-1 rounded mr-1 border border-red-800">
                                 {p.name}
                               </span>
                             ))}
                           </div>
                        </div>
                     </div>
                   );
                 }

                 const isImp = me?.isImpostor;
                 return (
                   <div className={`absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center border-4 bg-neutral-900 ${isImp ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]'}`}>
                      <div className="uppercase tracking-widest text-sm font-bold mb-4 text-neutral-500">
                        {isImp ? 'YOU ARE THE' : 'YOUR WORD IS'}
                      </div>
                      
                      {isImp ? (
                        <>
                          <h1 className="text-4xl font-black text-red-600 mb-2 tracking-wider">IMPOSTOR</h1>
                          <p className="text-red-300 mt-4">Try to blend in!</p>
                          {gameState.impostorWord && (
                             <div className="mt-6 p-3 bg-red-950/30 rounded border border-red-900/50">
                               <p className="text-xs text-red-400 uppercase">You see:</p>
                               <p className="text-xl font-bold text-red-200">{gameState.impostorWord}</p>
                             </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h1 className="text-4xl font-black text-blue-500 mb-2">{gameState.secretWord}</h1>
                          <p className="text-blue-200/70 mt-4">Describe it carefully!</p>
                        </>
                      )}
                   </div>
                 );
               })()}
            </div>

            {!isHost ? (
              <Button 
                onClick={handleReady} 
                disabled={gameState.players.find(p => p.id === localPlayer.id)?.isReady}
                className={gameState.players.find(p => p.id === localPlayer.id)?.isReady ? 'opacity-50 grayscale' : 'animate-bounce'}
              >
                {gameState.players.find(p => p.id === localPlayer.id)?.isReady ? 'Waiting for others...' : "I'm Ready"}
              </Button>
            ) : (
              <div className="text-neutral-400 animate-pulse">Waiting for players to ready up...</div>
            )}
            
            <div className="text-sm text-neutral-500">
              {gameState.players.filter(p => p.isReady).length} / {gameState.players.filter(p => !p.isHost).length} players ready
            </div>
          </div>
        )}

        {/* DESCRIBING PHASE (Online) OR OFFLINE PLAY */}
        {gameState.phase === Phase.DESCRIBING && (
          isOfflineMode ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
              <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center animate-pulse">
                <MegaphoneIcon />
              </div>
              <h2 className="text-2xl font-bold text-white">Game in Progress</h2>
              <p className="text-neutral-400 max-w-xs mx-auto">
                Players are discussing offline. Voting will happen in real life.
              </p>
              
              {isHost && (
                <div className="mt-8 bg-neutral-900 p-6 rounded-xl border border-neutral-800 w-full">
                   <h3 className="text-lg font-bold text-red-500 mb-4">Game Master Controls</h3>
                   <Button variant="danger" fullWidth onClick={handleOfflineEndGame}>
                     End Game & Reveal Roles
                   </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Bar */}
              <div className="bg-neutral-900 p-4 rounded-xl flex items-center justify-between border border-neutral-800">
                <div>
                  <span className="text-neutral-400 text-sm">Round 1</span>
                  {gameState.settings?.timerSeconds > 0 && (
                    <span className="ml-2 text-xs text-neutral-500 border border-neutral-700 px-1 rounded">
                      {gameState.settings.timerSeconds}s
                    </span>
                  )}
                </div>
                {/* Visual Turn Indicator */}
                <div className="flex gap-1 overflow-hidden max-w-[150px]">
                  {gameState.players.filter(p => !p.isHost).map((p, idx) => (
                    <div key={idx} className={`h-2 flex-1 min-w-[4px] rounded-full ${p.id === activePlayerId ? 'bg-red-600 animate-pulse' : 'bg-neutral-800'}`} />
                  ))}
                </div>
              </div>

              {/* Description Feed */}
              <div className="space-y-4">
                {gameState.players.filter(p => !p.isHost).map((p, idx) => {
                  // We need to determine if this specific player has played, is playing, or is waiting
                  // based on their ID vs the turn index ID, not loop index.
                  
                  const isCurrentTurn = p.id === activePlayerId;
                  
                  // Simple check: if they have a description, they played. 
                  // If they are current turn, they are playing.
                  // If neither, waiting.
                  
                  if (!p.description && !isCurrentTurn) {
                    return (
                      <div key={p.id} className="opacity-30 flex items-center gap-3 p-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-500">{p.name[0]}</div>
                        <span className="text-sm text-neutral-500">Waiting...</span>
                      </div>
                    );
                  }
                  
                  if (isCurrentTurn) {
                      return (
                        <div key={p.id} className="bg-neutral-900 border border-red-900/50 p-4 rounded-xl shadow-lg transform scale-105 transition-all relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center font-bold text-red-200 text-sm border border-red-700">{p.name[0]}</div>
                            <span className="font-bold text-red-400">{p.name}'s Turn</span>
                          </div>
                          
                          {p.id === localPlayer.id ? (
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={descriptionText}
                                onChange={e => setDescriptionText(e.target.value)}
                                className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-red-600 text-white"
                                placeholder="Describe your word..."
                                autoFocus
                              />
                              <Button onClick={handleSubmitDescription} disabled={!descriptionText.trim()} className="py-2 px-4">Send</Button>
                            </div>
                          ) : (
                            <div className="text-neutral-500 italic text-sm animate-pulse">Typing...</div>
                          )}
                        </div>
                      );
                  }

                  return (
                    <div key={p.id} className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-neutral-400 text-xs uppercase tracking-wider">{p.name}</span>
                      </div>
                      <p className="text-neutral-200 text-lg">"{p.description}"</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* VOTING PHASE (Responsive Fix) */}
        {gameState.phase === Phase.VOTING && (
           <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-0 sm:p-4">
             {/* Container - Full Screen on mobile, Boxed on desktop */}
             <div className="bg-[#2d3748] w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl border-none sm:border-[8px] sm:border-[#4a5568] shadow-2xl overflow-hidden flex flex-col relative">
               
               {/* Header */}
               <div className="bg-[#2d3748] p-4 flex justify-between items-center border-b-2 border-[#4a5568] shrink-0">
                 <div className="text-white font-bold text-lg sm:text-2xl drop-shadow-md select-none">
                   Who Is The Impostor?
                 </div>
                 {isHost ? <div className="text-xs bg-yellow-600 px-2 py-1 rounded text-white">GM VIEW</div> : null}
               </div>

               {/* Player Grid - Flex on mobile for vertical scrolling, Grid on larger */}
               <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-800 relative">
                 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                 {/* Use flex-col for mobile to ensure easy scrolling and tapping */}
                 <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 relative z-10 pb-20 sm:pb-0">
                   {gameState.players.filter(p => !p.isHost).map(p => {
                     const isMe = p.id === localPlayer.id;
                     const hasVoted = p.votedForId !== null;
                     const isSelected = selectedVoteId === p.id;
                     
                     // Check if I have already locked in a vote
                     const myLockedVote = gameState.players.find(me => me.id === localPlayer.id)?.votedForId;
                     const iHaveVoted = myLockedVote !== null;

                     return (
                       <button
                         key={p.id}
                         disabled={isMe || iHaveVoted || isHost}
                         onClick={() => setSelectedVoteId(p.id)}
                         className={`
                           relative group w-full p-2 sm:px-2 sm:pr-4 rounded-xl sm:rounded-full flex items-center transition-all duration-200 outline-none
                           ${(isMe || isHost) ? 'opacity-60 cursor-default' : 'cursor-pointer hover:brightness-110 active:scale-[0.98]'}
                           ${isSelected ? 'bg-green-100 ring-4 ring-green-500 shadow-lg' : 'bg-[#c8dce7]'}
                         `}
                       >
                         {/* Avatar Box */}
                         <div className={`
                            h-12 w-12 sm:h-12 sm:w-12 rounded-lg sm:rounded-l-full sm:rounded-r-lg mr-3 flex items-center justify-center relative overflow-hidden shrink-0
                            bg-gradient-to-br ${getAvatarColor(p.name)}
                         `}>
                             <span className="text-white font-black text-lg shadow-sm">{p.name[0]}</span>
                             
                             {hasVoted && (
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                 <div className="bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded transform -rotate-12 border border-white shadow-sm">
                                   VOTED
                                 </div>
                               </div>
                             )}
                         </div>

                         {/* Name & Indicators */}
                         <div className="flex-1 flex items-center justify-between min-w-0">
                           <span className={`font-bold text-lg truncate ${isSelected ? 'text-green-800' : 'text-slate-900'}`}>
                             {p.name}
                           </span>
                           {isMe && <div className="text-slate-500"><MegaphoneIcon /></div>}
                         </div>
                       </button>
                     );
                   })}
                 </div>
               </div>

               {/* Footer / Action Bar */}
               <div className="bg-[#2d3748] p-4 border-t-2 border-[#4a5568] flex items-center justify-between shrink-0">
                 {isHost ? (
                    <div className="text-neutral-400 text-sm italic w-full text-center">
                      Monitoring Voting Process...
                    </div>
                 ) : (
                   <>
                     <button className="flex items-center gap-2 px-3 py-2 bg-slate-600 rounded-lg text-slate-300 font-bold text-xs sm:text-sm cursor-not-allowed opacity-50 border-b-4 border-slate-800">
                        Skip
                     </button>

                     <div className="flex items-center gap-4">
                        {selectedVoteId && !gameState.players.find(p => p.id === localPlayer.id)?.votedForId && (
                          <button 
                            onClick={handleConfirmVote}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg animate-bounce"
                          >
                            VOTE
                          </button>
                        )}

                        {gameState.players.find(p => p.id === localPlayer.id)?.votedForId && (
                           <span className="text-green-400 font-bold text-xs sm:text-sm animate-pulse">Waiting...</span>
                        )}
                     </div>
                   </>
                 )}
               </div>
               
             </div>
           </div>
        )}

        {/* RESULTS PHASE */}
        {gameState.phase === Phase.RESULTS && (
          <div className="text-center space-y-8 pt-8">
            {isOfflineMode ? (
              <div className="text-3xl font-black text-white">GAME OVER</div>
            ) : (
              <div className="relative inline-block">
                <div className={`text-5xl font-black ${gameState.winner === 'CREW' ? 'text-blue-500' : 'text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]'}`}>
                  {gameState.winner === 'CREW' ? 'CREW WINS!' : 'IMPOSTOR WINS!'}
                </div>
              </div>
            )}

            <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 max-w-sm mx-auto shadow-2xl">
               <div className="mb-6">
                 <p className="text-xs uppercase tracking-widest text-neutral-500 mb-4">The Impostor(s)</p>
                 <div className="flex items-center justify-center gap-3">
                   {gameState.players.filter(p => p.isImpostor).map(imp => (
                     <div key={imp.id} className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-3xl font-bold mb-3 shadow-lg shadow-red-900/50">
                          {imp.name[0]}
                        </div>
                        <div className="text-xl font-bold text-white">
                          {imp.name}
                        </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 text-sm mt-8 border-t border-neutral-800 pt-6">
                 <div className="bg-black/50 p-3 rounded border border-neutral-800">
                   <p className="text-neutral-500 mb-1 text-xs uppercase">Secret Word</p>
                   <p className="text-blue-400 font-bold text-lg">{gameState.secretWord}</p>
                 </div>
                 <div className="bg-black/50 p-3 rounded border border-neutral-800">
                   <p className="text-neutral-500 mb-1 text-xs uppercase">Impostor Word</p>
                   <p className="text-red-500 font-bold text-lg">{gameState.impostorWord}</p>
                 </div>
               </div>
            </div>

            {isHost && (
              <div className="pt-4">
                <Button onClick={handleReset} className="animate-bounce shadow-red-900/40">
                  Play Again
                </Button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);