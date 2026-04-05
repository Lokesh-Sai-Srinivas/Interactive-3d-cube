import { create } from 'zustand';

export type Move = 'L' | "L'" | 'R' | "R'" | 'U' | "U'" | 'D' | "D'" | 'F' | "F'" | 'B' | "B'" | 'M' | "M'" | 'X' | "X'" | 'Y' | "Y'" | 'Z' | "Z'";
export type FacingMode = 'face' | 'vertex' | 'edge';

export const DEFAULT_BINDINGS: Record<string, string> = {
  'L': 'l', 'R': 'r', 'U': 'u', 'D': 'd', 'F': 'f', 'B': 'b', 'M': 'm', 'X': 'x', 'Y': 'y', 'Z': 'z'
};

interface AppState {
  moveQueue: Move[];
  tutorialPage: number; // 0 means inactive, 1, 2, 3 are pages
  resetCubeToggle: boolean;
  isAnimating: boolean;
  isShuffling: boolean;
  showSettings: boolean;
  facingMode: FacingMode;
  keyBindings: Record<string, string>; // Base move e.g. 'L' -> mapped key e.g. 'a'
  addMove: (move: Move) => void;
  popMove: () => void;
  setAnimating: (status: boolean) => void;
  shuffle: () => void;
  goToTutorialPage: (page: number) => void;
  endTutorial: () => void;
  resetCube: () => void;
  clearQueue: () => void;
  toggleSettings: () => void;
  setKeyBinding: (move: string, key: string) => void;
  resetBindings: () => void;
  setFacingMode: (mode: FacingMode) => void;
}

export const useStore = create<AppState>((set, get) => ({
  moveQueue: [],
  tutorialPage: 0,
  resetCubeToggle: false,
  isAnimating: false,
  isShuffling: false,
  showSettings: false,
  facingMode: 'face',
  keyBindings: { ...DEFAULT_BINDINGS },
  addMove: (move) => set((state) => ({ moveQueue: [...state.moveQueue, move] })),
  popMove: () => set((state) => {
    const newQueue = state.moveQueue.slice(1);
    return { 
      moveQueue: newQueue,
      isShuffling: newQueue.length === 0 ? false : state.isShuffling 
    };
  }),
  clearQueue: () => set({ moveQueue: [], isShuffling: false, isAnimating: false }),
  resetCube: () => set((state) => ({ resetCubeToggle: !state.resetCubeToggle, moveQueue: [], isAnimating: false })),
  setAnimating: (status) => set({ isAnimating: status }),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  setKeyBinding: (move, key) => set((state) => {
    // Prevent duplicate bindings by searching if this key is already bound to something else,
    // and if it is, swapping them or just overriding. We'll simply override (multiple moves could map to one, or we explicitly unbind).
    // The simplest way: explicitly remove old binding sharing this key to avoid confusion:
    const newBindings = { ...state.keyBindings };
    for (const [m, k] of Object.entries(newBindings)) {
      if (k === key) newBindings[m] = ''; // Unbind existing
    }
    newBindings[move] = key;
    return { keyBindings: newBindings };
  }),
  resetBindings: () => set({ keyBindings: { ...DEFAULT_BINDINGS }, facingMode: 'face' }),
  setFacingMode: (mode) => set({ facingMode: mode }),
  shuffle: () => {
    const faces = ['L', 'R', 'U', 'D', 'F', 'B'];
    const validModifiers = ['', "'"];
    
    let lastFace = '';
    const randomMoves: Move[] = [];
    
    for (let i = 0; i < 20; i++) {
        let randomFace = faces[Math.floor(Math.random() * faces.length)];
        while (randomFace === lastFace) {
             randomFace = faces[Math.floor(Math.random() * faces.length)];
        }
        lastFace = randomFace;
        const randomMod = validModifiers[Math.floor(Math.random() * validModifiers.length)];
        randomMoves.push(`${randomFace}${randomMod}` as Move);
    }
    
    set((state) => ({ 
      moveQueue: [...state.moveQueue, ...randomMoves],
      isShuffling: true 
    }));
  },
  goToTutorialPage: (page) => {
    set({ tutorialPage: page });
    get().resetCube();
  },
  endTutorial: () => set({ tutorialPage: 0 }),
}));
