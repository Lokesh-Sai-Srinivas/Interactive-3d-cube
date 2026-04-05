import { useEffect, useState } from 'react';
import { useStore, type Move } from '../store/rubiksStore';
import { Shuffle, X, ChevronRight, ChevronLeft, Settings, RotateCcw } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import StandaloneCube from './StandaloneCube';

const MiniCubeDisplay = ({ move, label }: { move: Move, label: string }) => (
  <div className="mini-cube-item">
     <div className="mini-cube-label">{label}</div>
     <div className="mini-cube-canvas-wrapper">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
           <ambientLight intensity={0.5} />
           <pointLight position={[10, 10, 10]} intensity={1.5} />
           <StandaloneCube move={move} />
        </Canvas>
     </div>
  </div>
);

export default function UI() {
  const moveQueue = useStore((state) => state.moveQueue);
  const isShuffling = useStore((state) => state.isShuffling);
  const addMove = useStore((state) => state.addMove);
  const shuffle = useStore((state) => state.shuffle);
  
  const tutorialPage = useStore((state) => state.tutorialPage);
  const goToTutorialPage = useStore((state) => state.goToTutorialPage);
  const endTutorial = useStore((state) => state.endTutorial);

  const showSettings = useStore((state) => state.showSettings);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const keyBindings = useStore((state) => state.keyBindings);
  const setKeyBinding = useStore((state) => state.setKeyBinding);
  const resetBindings = useStore((state) => state.resetBindings);

  const facingMode = useStore((state) => state.facingMode);
  const setFacingMode = useStore((state) => state.setFacingMode);

  const [primeModifier, setPrimeModifier] = useState(false);
  const [listeningForKey, setListeningForKey] = useState<string | null>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (listeningForKey) {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key !== 'escape' && key !== 'shift') {
          setKeyBinding(listeningForKey, key);
        }
        setListeningForKey(null);
        return;
      }

      const rawKey = e.key.toLowerCase();
      const isShift = e.shiftKey;

      // Find which Move this key is bound to:
      const boundMove = Object.keys(keyBindings).find(m => keyBindings[m] === rawKey);

      if (boundMove) {
        const move = `${boundMove}${isShift ? "'" : ""}` as Move;
        addMove(move);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addMove, keyBindings, listeningForKey, setKeyBinding]);

  const handleVirtualKey = (key: string) => {
    const move = `${key}${primeModifier ? "'" : ""}` as Move;
    addMove(move);
  };

  const renderTutorialContent = () => {
    switch (tutorialPage) {
      case 1:
        return (
          <>
            <h2>Page 1: Normal Moves</h2>
            <p>Standard clockwise face rotations:</p>
            <div className="mini-cube-grid">
               <MiniCubeDisplay move="L" label="L (Left)" />
               <MiniCubeDisplay move="R" label="R (Right)" />
               <MiniCubeDisplay move="U" label="U (Up)" />
               <MiniCubeDisplay move="D" label="D (Down)" />
               <MiniCubeDisplay move="F" label="F (Front)" />
               <MiniCubeDisplay move="B" label="B (Back)" />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2>Page 2: Counter Moves</h2>
            <p>Counter-clockwise (Prime) rotations using the ' symbol.</p>
            <div className="mini-cube-grid">
               <MiniCubeDisplay move="L'" label="L' (Prime)" />
               <MiniCubeDisplay move="R'" label="R' (Prime)" />
               <MiniCubeDisplay move="U'" label="U' (Prime)" />
               <MiniCubeDisplay move="D'" label="D' (Prime)" />
               <MiniCubeDisplay move="F'" label="F' (Prime)" />
               <MiniCubeDisplay move="B'" label="B' (Prime)" />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2>Page 3: Cube Rotations</h2>
            <p>Rotate the entire cube around the X, Y, or Z axes, and their counters X', Y', Z'.</p>
            <div className="mini-cube-grid">
               <MiniCubeDisplay move="X" label="X" />
               <MiniCubeDisplay move="X'" label="X'" />
               <MiniCubeDisplay move="Y" label="Y" />
               <MiniCubeDisplay move="Y'" label="Y'" />
               <MiniCubeDisplay move="Z" label="Z" />
               <MiniCubeDisplay move="Z'" label="Z'" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="ui-container top">
        {/* Move History / Queue */}
        <div className="move-queue" style={{ visibility: isShuffling || tutorialPage > 0 || showSettings ? 'hidden' : 'visible' }}>
          {moveQueue.map((m, i) => (
            <span key={i} className="move-badge">{m}</span>
          ))}
        </div>
        
        {/* Actions */}
        <div className="actions">
          {tutorialPage === 0 && !showSettings && (
            <>
              <button className="action-btn" onClick={toggleSettings} title="Settings">
                <Settings size={20} />
              </button>
              <button className="action-btn" onClick={() => goToTutorialPage(1)} title="Tutorial">
                 ?
              </button>
              <button className="action-btn" onClick={() => shuffle()} title="Shuffle">
                <Shuffle size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {showSettings && !isShuffling && (
        <div className="tutorial-overlay large-modal">
          <button className="close-btn" onClick={toggleSettings}><X size={24} /></button>
          <div className="tutorial-content">
             <h2>Keybindings & View Settings</h2>
             <p>Configure which keyboard keys trigger which moves, and customize the default viewing angle.</p>
             <div className="settings-grid">
                <div className="setting-row" style={{ gridColumn: '1 / -1', background: '#e1e5f2' }}>
                  <span className="setting-label">Default Camera Facing</span>
                  <select 
                    className="setting-input" 
                    value={facingMode} 
                    onChange={(e) => setFacingMode(e.target.value as any)}
                    style={{ minWidth: '150px' }}
                  >
                    <option value="face">Face (Frontal View)</option>
                    <option value="vertex">Vertex (Diagonal View)</option>
                    <option value="edge">Edge View</option>
                  </select>
                </div>

                {Object.keys(keyBindings).map((move) => (
                  <div className="setting-row" key={move}>
                    <span className="setting-label">Move {move}</span>
                    <button 
                      className={`setting-input ${listeningForKey === move ? 'listening' : ''}`}
                      onClick={() => setListeningForKey(move)}
                    >
                      {listeningForKey === move ? 'Press any key...' : (keyBindings[move].toUpperCase() || '(unbound)')}
                    </button>
                  </div>
                ))}
             </div>
             <button className="reset-bindings-btn" onClick={resetBindings}>
                <RotateCcw size={16} /> Restore Defaults
             </button>
          </div>
        </div>
      )}

      {tutorialPage > 0 && !showSettings && !isShuffling && (
        <div className="tutorial-overlay large-modal">
          <button className="close-btn" onClick={endTutorial}><X size={24} /></button>
          
          <div className="tutorial-content">
            {renderTutorialContent()}
          </div>

          <div className="tutorial-nav">
             <button disabled={tutorialPage === 1} onClick={() => goToTutorialPage(tutorialPage - 1)}>
                <ChevronLeft /> Prev
             </button>
             <span className="page-indicator">{tutorialPage} / 3</span>
             {tutorialPage < 3 ? (
               <button onClick={() => goToTutorialPage(tutorialPage + 1)}>
                  Next <ChevronRight />
               </button>
             ) : (
               <button onClick={endTutorial} className="finish-btn">
                  Finish
               </button>
             )}
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <div className="mobile-controls">
        <div className="mobile-keys">
          {['U', 'D', 'L', 'R', 'F', 'B', 'M', 'X', 'Y', 'Z'].map(key => (
            <button key={key} className="key-btn" onClick={() => handleVirtualKey(key)}>
              {key}{primeModifier ? "'" : ""}
            </button>
          ))}
          <button 
            className={`key-btn modifier-btn ${primeModifier ? 'active' : ''}`}
            onClick={() => setPrimeModifier(!primeModifier)}
          >
             Prime (')
          </button>
        </div>
      </div>
    </>
  );
}
