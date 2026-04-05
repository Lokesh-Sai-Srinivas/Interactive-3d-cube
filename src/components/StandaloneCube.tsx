import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Move } from '../store/rubiksStore';

const CUBE_COLORS = {
  right: 'red', left: 'orange', top: 'white',
  bottom: 'yellow', front: 'green', back: 'blue', inner: '#111111'
};

interface MoveConfig { axis: 'x' | 'y' | 'z'; slice: number | 'all'; dir: number; }
const MOVE_MAP: Record<Move, MoveConfig> = {
  "R": { axis: 'x', slice: 1, dir: -1 }, "R'": { axis: 'x', slice: 1, dir: 1 },
  "L": { axis: 'x', slice: -1, dir: 1 }, "L'": { axis: 'x', slice: -1, dir: -1 },
  "U": { axis: 'y', slice: 1, dir: -1 }, "U'": { axis: 'y', slice: 1, dir: 1 },
  "D": { axis: 'y', slice: -1, dir: 1 }, "D'": { axis: 'y', slice: -1, dir: -1 },
  "F": { axis: 'z', slice: 1, dir: -1 }, "F'": { axis: 'z', slice: 1, dir: 1 },
  "B": { axis: 'z', slice: -1, dir: 1 }, "B'": { axis: 'z', slice: -1, dir: -1 },
  "M": { axis: 'x', slice: 0, dir: 1 }, "M'": { axis: 'x', slice: 0, dir: -1 },
  "X": { axis: 'x', slice: 'all', dir: -1 }, "X'": { axis: 'x', slice: 'all', dir: 1 },
  "Y": { axis: 'y', slice: 'all', dir: -1 }, "Y'": { axis: 'y', slice: 'all', dir: 1 },
  "Z": { axis: 'z', slice: 'all', dir: -1 }, "Z'": { axis: 'z', slice: 'all', dir: 1 }
};

export default function StandaloneCube({ move }: { move: Move }) {
  const cubeGroupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(new THREE.Group());
  const meshesRef = useRef<THREE.Mesh[]>([]);

  const stateRef = useRef({
    active: false,
    progress: 0,
    targetAngle: 0,
    attachedMeshes: [] as THREE.Mesh[],
    pauseTimer: 0.5 // Start with a brief pause before first play
  });

  const cubies = useMemo(() => {
    const arr = [];
    let id = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          arr.push({ id: id++, initialPosition: new THREE.Vector3(x, y, z) });
        }
      }
    }
    return arr;
  }, []);

  const resetCube = () => {
    const scene = cubeGroupRef.current;
    if (!scene) return;
    stateRef.current.active = false;
    stateRef.current.attachedMeshes.forEach(m => scene.attach(m));
    stateRef.current.attachedMeshes = [];
    pivotRef.current.rotation.set(0,0,0);
    
    meshesRef.current.forEach(mesh => {
      if (!mesh) return;
      mesh.position.copy(mesh.userData.initialPosition);
      mesh.rotation.set(0, 0, 0);
      mesh.updateMatrixWorld();
    });
  };

  useFrame((_, delta) => {
    const s = stateRef.current;
    const config = MOVE_MAP[move];

    if (s.pauseTimer > 0) {
      s.pauseTimer -= delta;
      if (s.pauseTimer <= 0) {
        // Trigger next loop cycle
        resetCube();
        s.active = true;
        s.progress = 0;
        s.targetAngle = (Math.PI / 2) * config.dir;
        
        const scene = cubeGroupRef.current;
        const pivot = pivotRef.current;
        pivot.rotation.set(0, 0, 0);
        pivot.position.set(0, 0, 0);
        pivot.updateMatrixWorld();
        scene!.add(pivot);

        const EPSILON = 0.1;
        meshesRef.current.forEach(mesh => {
          if (!mesh) return;
          const pos = mesh.position; // Since we just reset, local == world position
          let match = false;
          if (config.slice === 'all') match = true;
          else if (config.axis === 'x' && Math.abs(pos.x - config.slice) < EPSILON) match = true;
          else if (config.axis === 'y' && Math.abs(pos.y - config.slice) < EPSILON) match = true;
          else if (config.axis === 'z' && Math.abs(pos.z - config.slice) < EPSILON) match = true;

          if (match) {
            pivot.attach(mesh);
            s.attachedMeshes.push(mesh);
          }
        });
      }
      return;
    }

    if (s.active) {
      const step = 4 * delta; // Animation speed
      s.progress += step;
      const isFinished = s.progress >= Math.abs(s.targetAngle);
      
      if (isFinished) {
        pivotRef.current.rotation[config.axis] = s.targetAngle;
      } else {
        pivotRef.current.rotation[config.axis] = s.progress * Math.sign(s.targetAngle);
      }
      pivotRef.current.updateMatrixWorld();

      if (isFinished) {
        s.active = false;
        // Wait 1 second before doing it again
        s.pauseTimer = 1.0; 
      }
    }
  });

  return (
    <group ref={cubeGroupRef} rotation={[Math.PI / 6, -Math.PI / 4, 0]}>
      {cubies.map((cubie) => (
        <mesh
          key={cubie.id}
          ref={(el) => { if (el) meshesRef.current[cubie.id] = el as unknown as THREE.Mesh; }}
          position={cubie.initialPosition}
          userData={{ initialPosition: cubie.initialPosition }}
        >
          <boxGeometry args={[0.96, 0.96, 0.96]} />
          <meshStandardMaterial color={CUBE_COLORS.inner} roughness={0.8} />

          {cubie.initialPosition.x === 1 && (
            <mesh position={[0.481, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.84, 0.84]} />
              <meshStandardMaterial color={CUBE_COLORS.right} roughness={0.2} metalness={0.1} />
            </mesh>
          )}
          {cubie.initialPosition.x === -1 && (
            <mesh position={[-0.481, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.84, 0.84]} />
              <meshStandardMaterial color={CUBE_COLORS.left} roughness={0.2} metalness={0.1} />
            </mesh>
          )}
          {cubie.initialPosition.y === 1 && (
            <mesh position={[0, 0.481, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.84, 0.84]} />
              <meshStandardMaterial color={CUBE_COLORS.top} roughness={0.2} metalness={0.1} />
            </mesh>
          )}
          {cubie.initialPosition.y === -1 && (
            <mesh position={[0, -0.481, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.84, 0.84]} />
              <meshStandardMaterial color={CUBE_COLORS.bottom} roughness={0.2} metalness={0.1} />
            </mesh>
          )}
          {cubie.initialPosition.z === 1 && (
            <mesh position={[0, 0, 0.481]} rotation={[0, 0, 0]}>
              <planeGeometry args={[0.84, 0.84]} />
              <meshStandardMaterial color={CUBE_COLORS.front} roughness={0.2} metalness={0.1} />
            </mesh>
          )}
          {cubie.initialPosition.z === -1 && (
            <mesh position={[0, 0, -0.481]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.84, 0.84]} />
              <meshStandardMaterial color={CUBE_COLORS.back} roughness={0.2} metalness={0.1} />
            </mesh>
          )}
        </mesh>
      ))}
    </group>
  );
}
