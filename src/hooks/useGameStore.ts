import { create } from 'zustand';
import type { RoomType, Portal } from '../types';
import { ROOM_CONFIGS, PLAYER_CONFIG } from '../config/rooms';

interface DiceResult {
  dice1: number;
  dice2: number;
  dice3: number;
  total: number;
}

interface GameStore {
  currentRoom: RoomType;
  isPlaying: boolean;
  nearPortal: Portal | null;
  isLocked: boolean;
  
  money: number;
  isNearMiniGame: boolean;
  isMiniGameActive: boolean;
  
  diceResult: DiceResult | null;
  isRolling: boolean;
  shouldTriggerRoll: boolean;
  
  isNearBasketball: boolean;
  isBasketballActive: boolean;
  isHoldingBall: boolean;
  throwPower: number;
  isChargingThrow: boolean;
  basketballScore: number;
  basketballAttempts: number;
  basketballBetAmount: number;
  basketballBetPlaced: boolean;
  lastBasketballResult: 'win' | 'lose' | null;
  
  playerTeleportTarget: { x: number; y: number; z: number } | null;
  currentBet: number | null;
  betAmount: number;
  lastBetForResult: number | null;
  lastBetAmountForResult: number;
  
  isNearSimon: boolean;
  isSimonActive: boolean;
  simonBetAmount: number;
  simonBetPlaced: boolean;
  simonPattern: number[];
  simonPlayerPattern: number[];
  simonScore: number;
  simonGameMessage: string;
  simonIsShowingPattern: boolean;
  simonCanClick: boolean;
  simonLitButton: number | null;
  simonIsGameOver: boolean;

  saveGame: (position: { x: number; y: number; z: number }, room?: RoomType) => void;
  loadGame: () => void;
  
  setCurrentRoom: (room: RoomType) => void;
  setIsPlaying: (playing: boolean) => void;
  setNearPortal: (portal: Portal | null) => void;
  setIsLocked: (locked: boolean) => void;
  teleportToRoom: (room: RoomType) => void;
  
  setMoney: (amount: number) => void;
  addMoney: (amount: number) => void;
  removeMoney: (amount: number) => boolean;
  
  setIsNearMiniGame: (near: boolean) => void;
  setIsMiniGameActive: (active: boolean) => void;
  
  setDiceResult: (result: DiceResult | null) => void;
  setIsRolling: (rolling: boolean) => void;
  triggerRoll: () => void;
  clearTriggerRoll: () => void;
  
  setIsNearBasketball: (near: boolean) => void;
  setIsBasketballActive: (active: boolean) => void;
  setIsHoldingBall: (holding: boolean) => void;
  setThrowPower: (power: number) => void;
  setIsChargingThrow: (charging: boolean) => void;
  incrementBasketballScore: () => void;
  incrementBasketballAttempts: () => void;
  resetBasketballGame: () => void;
  placeBasketballBet: (amount: number) => boolean;
  resolveBasketballBet: (scored: boolean) => void;
  setPlayerTeleportTarget: (target: { x: number; y: number; z: number } | null) => void;
  enterBasketballZone: () => void;
  exitBasketballZone: () => void;
  
  setCurrentBet: (bet: number | null) => void;
  setBetAmount: (amount: number) => void;
  placeBet: (predictedSum: number, amount: number) => boolean;
  
  setIsNearSimon: (near: boolean) => void;
  setIsSimonActive: (active: boolean) => void;
  startSimonGame: (betAmount: number) => boolean;
  exitSimonGame: () => void;
  addToSimonPattern: () => void;
  simonButtonClick: (button: number) => void;
  setSimonLitButton: (button: number | null) => void;
  setSimonShowingPattern: (showing: boolean) => void;
  setSimonCanClick: (canClick: boolean) => void;
  setSimonGameMessage: (message: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentRoom: 'main',
  isPlaying: false,
  nearPortal: null,
  isLocked: false,
  
  money: 100,
  isNearMiniGame: false,
  isMiniGameActive: false,
  diceResult: null,
  isRolling: false,
  shouldTriggerRoll: false,
  
  isNearBasketball: false,
  isBasketballActive: false,
  isHoldingBall: false,
  throwPower: 0,
  isChargingThrow: false,
  basketballScore: 0,
  basketballAttempts: 0,
  basketballBetAmount: 0,
  basketballBetPlaced: false,
  lastBasketballResult: null,
  playerTeleportTarget: null,
  
  currentBet: null,
  betAmount: 0,
  lastBetForResult: null,
  lastBetAmountForResult: 0,
  
  isNearSimon: false,
  isSimonActive: false,
  simonBetAmount: 10,
  simonBetPlaced: false,
  simonPattern: [],
  simonPlayerPattern: [],
  simonScore: 0,
  simonGameMessage: '',
  simonIsShowingPattern: false,
  simonCanClick: false,
  simonLitButton: null,
  simonIsGameOver: false,

  saveGame: (position, room) => {
    const state = get();
    const data = {
      currentRoom: room ?? state.currentRoom,
      money: state.money,
      position,
    };

    try {
      localStorage.setItem('mini3d-save', JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem('mini3d-save');
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        currentRoom?: RoomType;
        money?: number;
        position?: { x: number; y: number; z: number };
      };

      if (!parsed.position) return;

      set({
        currentRoom: parsed.currentRoom ?? 'main',
        money: typeof parsed.money === 'number' ? Math.max(0, parsed.money) : 100,
        playerTeleportTarget: parsed.position,
      });
    } catch {
      // Ignore parse/load errors
    }
  },

  setCurrentRoom: (room) => {
    const config = ROOM_CONFIGS[room];
    const spawn = config.spawnPosition;
    const position = spawn
      ? { x: spawn.x, y: spawn.y, z: spawn.z }
      : { x: 0, y: PLAYER_CONFIG.spawnHeight, z: 0 };

    set({ 
      currentRoom: room, 
      diceResult: null,
      isNearMiniGame: false,
      isNearBasketball: false,
      currentBet: null,
      betAmount: 0,
      shouldTriggerRoll: false,
    });

    get().saveGame(position, room);
  },
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setNearPortal: (portal) => set({ nearPortal: portal }),
  setIsLocked: (locked) => set({ isLocked: locked }),
  teleportToRoom: (room) => {
    const config = ROOM_CONFIGS[room];
    const spawn = config.spawnPosition;
    const position = spawn
      ? { x: spawn.x, y: spawn.y, z: spawn.z }
      : { x: 0, y: PLAYER_CONFIG.spawnHeight, z: 0 };

    set({ 
      currentRoom: room, 
      nearPortal: null,
      isNearMiniGame: false,
      isMiniGameActive: false,
      isNearBasketball: false,
      isBasketballActive: false,
      isHoldingBall: false,
      throwPower: 0,
      isChargingThrow: false,
      basketballScore: 0,
      basketballAttempts: 0,
      basketballBetAmount: 0,
      basketballBetPlaced: false,
      lastBasketballResult: null,
      diceResult: null,
      currentBet: null,
      betAmount: 0,
      shouldTriggerRoll: false,
    });

    get().saveGame(position, room);
  },
  
  setMoney: (amount) => set({ money: Math.max(0, amount) }),
  addMoney: (amount) => set((state) => ({ money: state.money + amount })),
  removeMoney: (amount) => {
    const state = get();
    if (state.money >= amount) {
      set({ money: state.money - amount });
      return true;
    }
    return false;
  },
  
  setIsNearMiniGame: (near) => set({ isNearMiniGame: near }),
  setIsMiniGameActive: (active) => set({ isMiniGameActive: active }),
  
  setDiceResult: (result) => set({ diceResult: result }),
  setIsRolling: (rolling) => set({ isRolling: rolling }),
  
  triggerRoll: () => {
    const state = get();
    if (state.isRolling || state.currentBet === null || state.betAmount <= 0) return;
    set({ 
      shouldTriggerRoll: true,
      lastBetForResult: state.currentBet,
      lastBetAmountForResult: state.betAmount,
    });
  },
  
  clearTriggerRoll: () => set({ shouldTriggerRoll: false }),
  
  setIsNearBasketball: (near) => set({ isNearBasketball: near }),
  setIsBasketballActive: (active) => set({ isBasketballActive: active }),
  setIsHoldingBall: (holding) => set({ isHoldingBall: holding }),
  setThrowPower: (power) => set({ throwPower: Math.min(100, Math.max(0, power)) }),
  setIsChargingThrow: (charging) => set({ isChargingThrow: charging }),
  incrementBasketballScore: () => set((state) => ({ basketballScore: state.basketballScore + 1 })),
  incrementBasketballAttempts: () => set((state) => ({ basketballAttempts: state.basketballAttempts + 1 })),
  resetBasketballGame: () => set({
    basketballScore: 0,
    basketballAttempts: 0,
    isHoldingBall: false,
    throwPower: 0,
    isChargingThrow: false,
    basketballBetAmount: 0,
    basketballBetPlaced: false,
    lastBasketballResult: null,
  }),
  placeBasketballBet: (amount) => {
    const state = get();
    if (state.money < amount || amount <= 0) return false;
    set({ 
      money: state.money - amount,
      basketballBetAmount: amount,
      basketballBetPlaced: true,
      lastBasketballResult: null,
    });
    return true;
  },
  resolveBasketballBet: (scored) => {
    const state = get();
    if (!state.basketballBetPlaced) return;
    
    if (scored) {
      set({ 
        money: state.money + state.basketballBetAmount * 2,
        lastBasketballResult: 'win',
        basketballBetPlaced: false,
      });
    } else {
      set({ 
        lastBasketballResult: 'lose',
        basketballBetPlaced: false,
      });
    }
  },
  setPlayerTeleportTarget: (target) => set({ playerTeleportTarget: target }),
  enterBasketballZone: () => {
    set({ 
      playerTeleportTarget: { x: 0, y: 1.8, z: 1.5 },
      isBasketballActive: true,
    });
  },
  exitBasketballZone: () => {
    set({ 
      playerTeleportTarget: { x: 0, y: 1.8, z: 7 },
      isBasketballActive: false,
      isHoldingBall: false,
      throwPower: 0,
      isChargingThrow: false,
    });
  },
  
  setCurrentBet: (bet) => set({ currentBet: bet }),
  setBetAmount: (amount) => set({ betAmount: amount }),
  placeBet: (predictedSum, amount) => {
    const state = get();
    if (state.money < amount || amount <= 0) return false;
    if (predictedSum < 2 || predictedSum > 12) return false;
    
    set({ 
      money: state.money - amount,
      currentBet: predictedSum,
      betAmount: amount,
    });
    return true;
  },
  
  setIsNearSimon: (near) => set({ isNearSimon: near }),
  setIsSimonActive: (active) => set({ isSimonActive: active }),
  startSimonGame: (betAmount) => {
    const state = get();
    if (state.money < betAmount || betAmount <= 0) return false;
    
    set({
      money: state.money - betAmount,
      simonBetAmount: betAmount,
      simonBetPlaced: true,
      simonPattern: [],
      simonPlayerPattern: [],
      simonScore: 0,
      simonIsGameOver: false,
      simonGameMessage: 'Game started!',
    });
    return true;
  },
  exitSimonGame: () => set({
    isSimonActive: false,
    simonBetPlaced: false,
    simonPattern: [],
    simonPlayerPattern: [],
    simonScore: 0,
    simonIsShowingPattern: false,
    simonCanClick: false,
    simonLitButton: null,
    simonIsGameOver: false,
    simonGameMessage: '',
  }),
  addToSimonPattern: () => {
    const newButton = Math.floor(Math.random() * 5); // 0~4 (5개의 버튼)
    set((state) => ({
      simonPattern: [...state.simonPattern, newButton],
      simonPlayerPattern: [],
      simonIsShowingPattern: true,
      simonCanClick: false,
      simonGameMessage: 'Memorize the pattern!',
    }));
  },
  simonButtonClick: (button) => {
    const state = get();
    if (!state.simonCanClick || state.simonIsShowingPattern || state.simonIsGameOver) return;
    
    const newPlayerPattern = [...state.simonPlayerPattern, button];
    const currentIndex = newPlayerPattern.length - 1;
    
    // 틀림
    if (state.simonPattern[currentIndex] !== button) {
      set({
        simonPlayerPattern: newPlayerPattern,
        simonIsGameOver: true,
        simonCanClick: false,
        simonGameMessage: `Game over! Final score: ${state.simonScore}`,
      });
      return;
    }
    
    // 패턴 완성
    if (newPlayerPattern.length === state.simonPattern.length) {
      const newScore = state.simonScore + 1;
      const reward = state.simonBetAmount * newScore;
      if (newScore >= 10) {
        set({
          simonPlayerPattern: newPlayerPattern,
          simonScore: newScore,
          money: state.money + reward,
          simonGameMessage: `Cleared 10 rounds! Reward: +${reward}`,
          simonCanClick: false,
          simonIsGameOver: true,
        });
      } else {
        set({
          simonPlayerPattern: newPlayerPattern,
          simonScore: newScore,
          money: state.money + reward,
          simonGameMessage: `Correct! +${reward}`,
          simonCanClick: false,
        });
      }
    } else {
      set({ simonPlayerPattern: newPlayerPattern });
    }
  },
  setSimonLitButton: (button) => set({ simonLitButton: button }),
  setSimonShowingPattern: (showing) => set({ simonIsShowingPattern: showing }),
  setSimonCanClick: (canClick) => set({ simonCanClick: canClick }),
  setSimonGameMessage: (message) => set({ simonGameMessage: message }),
}));
