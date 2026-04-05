import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type Move } from '../store/rubiksStore';

type CubieData = {
  id: number;
  initialPosition: THREE.Vector3;
};

const CUBE_COLORS = {
  right: 'red',
  left: 'orange',
  top: 'white',
  bottom: 'yellow',
  front: 'green',
  back: 'blue',
  inner: '#111111'
};

interface MoveConfig {
  axis: 'x' | 'y' | 'z';
  slice: number | 'all';
  dir: number;
}

const MOVE_MAP: Record<Move, MoveConfig> = {
  "R": { axis: 'x', slice: 1, dir: -1 },
  "R'": { axis: 'x', slice: 1, dir: 1 },
  "L": { axis: 'x', slice: -1, dir: 1 },
  "L'": { axis: 'x', slice: -1, dir: -1 },
  "U": { axis: 'y', slice: 1, dir: -1 },
  "U'": { axis: 'y', slice: 1, dir: 1 },
  "D": { axis: 'y', slice: -1, dir: 1 },
  "D'": { axis: 'y', slice: -1, dir: -1 },
  "F": { axis: 'z', slice: 1, dir: -1 },
  "F'": { axis: 'z', slice: 1, dir: 1 },
  "B": { axis: 'z', slice: -1, dir: 1 },
  "B'": { axis: 'z', slice: -1, dir: -1 },
  "M": { axis: 'x', slice: 0, dir: 1 },
  "M'": { axis: 'x', slice: 0, dir: -1 },
  "X": { axis: 'x', slice: 'all', dir: -1 },
  "X'": { axis: 'x', slice: 'all', dir: 1 },
  "Y": { axis: 'y', slice: 'all', dir: -1 },
  "Y'": { axis: 'y', slice: 'all', dir: 1 },
  "Z": { axis: 'z', slice: 'all', dir: -1 },
  "Z'": { axis: 'z', slice: 'all', dir: 1 }
};

export default function Cube() {
  const moveQueue = useStore((state) => state.moveQueue);
  const popMove = useStore((state) => state.popMove);
  const resetCubeToggle = useStore((state) => state.resetCubeToggle);
  
  const cubeGroupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(new THREE.Group());
  const meshesRef = useRef<THREE.Mesh[]>([]);

  const animatingRef = useRef<{
    active: boolean;
    moveConfig?: MoveConfig;
    progress: number;
    targetAngle: number;
    attachedMeshes: THREE.Mesh[];
  }>({
    active: false,
    progress: 0,
    targetAngle: 0,
    attachedMeshes: []
  });

  const cubies = useMemo<CubieData[]>(() => {
    const arr: CubieData[] = [];
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

  // Reset cube instantly back to solved state
  useEffect(() => {
    const scene = cubeGroupRef.current;
    if (!scene) return;
    
    // If currently animating, stop it immediately
    animatingRef.current.active = false;
    animatingRef.current.attachedMeshes.forEach(mesh => scene.attach(mesh));
    animatingRef.current.attachedMeshes = [];
    pivotRef.current.rotation.set(0,0,0);
    
    meshesRef.current.forEach(mesh => {
      if (!mesh) return;
      mesh.position.copy(mesh.userData.initialPosition);
      mesh.rotation.set(0, 0, 0);
      mesh.updateMatrixWorld();
    });
  }, [resetCubeToggle]);

  useFrame((_, delta) => {
    const anim = animatingRef.current;

    if (!anim.active) {
      if (moveQueue.length > 0 && cubeGroupRef.current) {
        const moveStr = moveQueue[0];
        const config = MOVE_MAP[moveStr];
        
        if (!config) {
          popMove();
          return;
        }

        anim.active = true;
        anim.progress = 0;
        anim.moveConfig = config;
        anim.targetAngle = (Math.PI / 2) * config.dir;
        
        const scene = cubeGroupRef.current;
        const pivot = pivotRef.current;
        
        pivot.rotation.set(0, 0, 0);
        pivot.position.set(0, 0, 0);
        pivot.updateMatrixWorld();
        scene.add(pivot);

        anim.attachedMeshes = [];
        const EPSILON = 0.1;
        
        meshesRef.current.forEach(mesh => {
          if (!mesh) return;
          const pos = mesh.position;
          
          let match = false;
          if (config.slice === 'all') {
            match = true;
          } else {
            if (config.axis === 'x' && Math.abs(pos.x - config.slice) < EPSILON) match = true;
            if (config.axis === 'y' && Math.abs(pos.y - config.slice) < EPSILON) match = true;
            if (config.axis === 'z' && Math.abs(pos.z - config.slice) < EPSILON) match = true;
          }

          if (match) {
            pivot.attach(mesh);
            anim.attachedMeshes.push(mesh);
          }
        });
      }
    } else if (anim.moveConfig) {
      const isShuffling = useStore.getState().isShuffling;
      const speed = isShuffling ? 15 : 6; 
      const step = speed * delta;
      
      anim.progress += step;
      const isFinished = anim.progress >= Math.abs(anim.targetAngle);
      
      if (isFinished) {
        pivotRef.current.rotation[anim.moveConfig.axis] = anim.targetAngle;
      } else {
        pivotRef.current.rotation[anim.moveConfig.axis] = anim.progress * Math.sign(anim.targetAngle);
      }
      
      pivotRef.current.updateMatrixWorld();

      if (isFinished) {
        const scene = cubeGroupRef.current;
        if (scene) {
          anim.attachedMeshes.forEach(mesh => {
            scene.attach(mesh);
            mesh.position.x = Math.round(mesh.position.x);
            mesh.position.y = Math.round(mesh.position.y);
            mesh.position.z = Math.round(mesh.position.z);
            
            const euler = new THREE.Euler().setFromQuaternion(mesh.quaternion);
            euler.x = Math.round(euler.x / (Math.PI/2)) * (Math.PI/2);
            euler.y = Math.round(euler.y / (Math.PI/2)) * (Math.PI/2);
            euler.z = Math.round(euler.z / (Math.PI/2)) * (Math.PI/2);
            mesh.quaternion.setFromEuler(euler);
          });
        }
        
        pivotRef.current.rotation.set(0,0,0);
        anim.active = false;
        anim.attachedMeshes = [];
        popMove();
      }
    }
  });

  return (
    <group ref={cubeGroupRef}>
      {cubies.map((cubie) => {
        return (
          <mesh
            key={cubie.id}
            ref={(el) => { if (el) meshesRef.current[cubie.id] = el as unknown as THREE.Mesh; }}
            position={cubie.initialPosition}
            userData={{ initialPosition: cubie.initialPosition }}
          >
            <boxGeometry args={[0.96, 0.96, 0.96]} />
            <meshStandardMaterial color={CUBE_COLORS.inner} roughness={0.8} />

            {/* Render stickers only on the outer faces */}
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
        );
      })}
    </group>
  );
}
