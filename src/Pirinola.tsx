import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useDrag } from '@use-gesture/react'
import * as THREE from 'three'

interface PirinolaProps {
  appState: 'start' | 'playing' | 'result'
  onResult: (text: string) => void
}

const FACES = [
  'Todos Ponen',
  'Toma Uno',
  'Toma Dos',
  'Pon Uno',
  'Pon Dos',
  'Toma Todo'
]

export default function Pirinola({ appState, onResult }: PirinolaProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Physics state
  const [isSpinning, setIsSpinning] = useState(false)
  const angularVelocity = useRef(0)
  const wobblePhase = useRef(0)
  
  // Reset when starting
  useEffect(() => {
    if (appState === 'playing' && !isSpinning && angularVelocity.current === 0) {
        // Just started playing or restarted
    }
  }, [appState, isSpinning])

  const bind = useDrag(({ velocity: [vx], direction: [dx], active }) => {
    if (appState !== 'playing' || isSpinning) return
    
    if (!active && vx > 0.5) { // Threshold for a valid swipe
      // Apply initial velocity based on swipe speed and direction
      const speed = Math.min(Math.max(vx * 15, 20), 60)
      angularVelocity.current = speed * Math.sign(dx)
      setIsSpinning(true)
    }
  }, { filterTaps: true })

  useFrame((state, delta) => {
    if (!groupRef.current || !isSpinning) return

    const damping = 0.985 // Friction
    
    // Apply rotation
    groupRef.current.rotation.y += angularVelocity.current * delta
    
    // Apply friction
    angularVelocity.current *= damping

    // Wobble effect as it slows down
    const absVelocity = Math.abs(angularVelocity.current)
    if (absVelocity < 10 && absVelocity > 0.1) {
      wobblePhase.current += delta * 15
      // Wobble intensity increases as speed decreases
      const wobbleIntensity = (10 - absVelocity) * 0.03
      groupRef.current.rotation.x = Math.sin(wobblePhase.current) * wobbleIntensity
      groupRef.current.rotation.z = Math.cos(wobblePhase.current) * wobbleIntensity
    }

    // Stop condition
    if (absVelocity < 0.1) {
      setIsSpinning(false)
      angularVelocity.current = 0
      
      // Snap to nearest face
      const currentRot = groupRef.current.rotation.y
      const snapAngle = Math.PI / 3 // 60 degrees
      const snappedRot = Math.round(currentRot / snapAngle) * snapAngle
      
      groupRef.current.rotation.y = snappedRot
      // Reset wobble
      groupRef.current.rotation.x = 0
      groupRef.current.rotation.z = 0

      // Determine winning face (the one pointing towards +Z)
      let normalizedRot = snappedRot % (Math.PI * 2)
      if (normalizedRot < 0) normalizedRot += Math.PI * 2
      
      const steps = Math.round(normalizedRot / snapAngle)
      const faceIndex = (6 - (steps % 6)) % 6
      
      onResult(FACES[faceIndex])
    }
  })

  // Dimensions
  const bodyRadius = 1.5
  const bodyHeight = 2
  
  return (
    <group ref={groupRef} {...(bind() as any)} position={[0, 1.5, 0]}>
      {/* Mango (Handle) */}
      <mesh position={[0, bodyHeight / 2 + 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
        <meshStandardMaterial color="#A0522D" roughness={0.7} />
      </mesh>

      {/* Cuerpo (Hexagon) */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[bodyRadius, bodyRadius, bodyHeight, 6]} />
        <meshStandardMaterial color="#DEB887" roughness={0.6} />
      </mesh>

      {/* Punta (Tip) */}
      <mesh position={[0, -bodyHeight / 2 - 0.5, 0]} castShadow>
        <cylinderGeometry args={[bodyRadius, 0.1, 1, 6]} />
        <meshStandardMaterial color="#A0522D" roughness={0.7} />
      </mesh>

      {/* Textos en las caras */}
      {FACES.map((text, i) => {
        const angle = i * (Math.PI / 3)
        // Position slightly outside the cylinder radius
        const textRadius = bodyRadius + 0.01 
        const x = Math.sin(angle) * textRadius
        const z = Math.cos(angle) * textRadius
        
        return (
          <Text
            key={i}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
            fontSize={0.3}
            color="#3E2723"
            anchorX="center"
            anchorY="middle"
            maxWidth={bodyRadius * 1.2}
            textAlign="center"
            fontWeight="bold"
          >
            {text}
          </Text>
        )
      })}
    </group>
  )
}
