import { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
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
      const sensitivity = window.innerWidth < 768 ? 0.025 : 0.005;
      targetRotation.current.x += dy * sensitivity;
      targetRotation.current.y += dx * sensitivity;
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
  const { camera, size } = useThree();
  
  useEffect(() => {
    // If aspect ratio is portrait (mobile), increase camera distance to make it appear smaller!
    const aspect = size.width / size.height;
    const isMobile = aspect < 1;
    const zoomFactor = isMobile ? 1.5 : 1;

    let pos = new THREE.Vector3(0, 0, 7 * zoomFactor); // face
    if (facingMode === 'vertex') pos = new THREE.Vector3(4 * zoomFactor, 4 * zoomFactor, 4 * zoomFactor);
    if (facingMode === 'edge') pos = new THREE.Vector3(0, 4.95 * zoomFactor, 4.95 * zoomFactor);
    
    // Animate camera position smoothly? Or snap? Snapping is fine since DragController resets.
    camera.position.copy(pos);
    camera.lookAt(0, 0, 0);
  }, [facingMode, camera, size.width, size.height]);

  return null;
}

function App() {
  const goToTutorialPage = useStore((state) => state.goToTutorialPage);
  const isMobile = window.innerWidth < 768;

  // Trigger tutorial just once on load
  useEffect(() => {
    goToTutorialPage(1);
  }, [goToTutorialPage]);

  return (
    <div className="app-container">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, isMobile ? 1 : 1.5]}>
        <CameraController />
        <DragController />
        <pointLight position={[10, 10, 10]} intensity={isMobile ? 3 : 1.5} />
        <ambientLight intensity={isMobile ? 2 : 0.5} />
        <directionalLight position={[-10, -10, -10]} intensity={isMobile ? 1.5 : 0} />
        {!isMobile && <Environment preset="city" />}
        
        <group name="view-wrapper">
          <group position={[0, -0.2, 0]}>
            <Cube />
          </group>
        </group>
      </Canvas>
      <UI />
    </div>
  );
}

export default App;
