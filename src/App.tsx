import { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ContactShadows, Environment } from '@react-three/drei';
import Cube from './components/Cube';
import UI from './components/UI';
import { useStore } from './store/rubiksStore';
import './App.css';

function DragController() {
  const { gl } = useThree();
  const dragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const targetRotation = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      startMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startMouse.current.x;
      const dy = e.clientY - startMouse.current.y;
      startMouse.current = { x: e.clientX, y: e.clientY };
      targetRotation.current.x += dy * 0.005;
      targetRotation.current.y += dx * 0.005;
    };
    const onUp = () => { dragging.current = false; };
    
    gl.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      gl.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const group = state.scene.getObjectByName("view-wrapper");
    if (!group) return;
    
    if (!dragging.current) {
        targetRotation.current.x = THREE.MathUtils.lerp(targetRotation.current.x, 0, delta * 5);
        targetRotation.current.y = THREE.MathUtils.lerp(targetRotation.current.y, 0, delta * 5);
    }
    // Limit rotation so it doesn't spin wildly upside down
    targetRotation.current.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, targetRotation.current.x));
    
    group.rotation.x = targetRotation.current.x;
    group.rotation.y = targetRotation.current.y;
  });

  return null;
}

function CameraController() {
  const facingMode = useStore(state => state.facingMode);
  const { camera } = useThree();
  
  useEffect(() => {
    let pos = new THREE.Vector3(0, 0, 7); // face
    if (facingMode === 'vertex') pos = new THREE.Vector3(4, 4, 4);
    if (facingMode === 'edge') pos = new THREE.Vector3(0, 4.95, 4.95);
    
    // Animate camera position smoothly? Or snap? Snapping is fine since DragController resets.
    camera.position.copy(pos);
    camera.lookAt(0, 0, 0);
  }, [facingMode, camera]);

  return null;
}

function App() {
  const goToTutorialPage = useStore((state) => state.goToTutorialPage);

  // Trigger tutorial just once on load
  useEffect(() => {
    goToTutorialPage(1);
  }, [goToTutorialPage]);

  return (
    <div className="app-container">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <CameraController />
        <DragController />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <ambientLight intensity={0.5} />
        <Environment preset="city" />
        
        <group name="view-wrapper">
          <group position={[0, -0.2, 0]}>
            <Cube />
            <ContactShadows 
              position={[0, -2, 0]} 
              opacity={0.4} 
              scale={20} 
              blur={2} 
              far={4} 
            />
          </group>
        </group>
      </Canvas>
      <UI />
    </div>
  );
}

export default App;
