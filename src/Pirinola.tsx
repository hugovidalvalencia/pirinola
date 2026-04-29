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
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'falling' | 'waiting'>('idle')
  const angularVelocity = useRef(0)
  const wobblePhase = useRef(0)
  
  // Fall state
  const targetSnapY = useRef(0)
  const startFallX = useRef(0)
  const startFallZ = useRef(0)
  const startFallPosY = useRef(0)
  const fallProgress = useRef(0)
  
  // Reset when starting
  useEffect(() => {
    if (appState === 'playing') {
        if (groupRef.current) {
          groupRef.current.rotation.set(0, 0, 0)
          groupRef.current.position.set(0, 1.5, 0)
          angularVelocity.current = 0
          setPhase('idle')
        }
    }
  }, [appState])

  const bind = useDrag(({ swipe: [swipeX], velocity: [vx], active, movement: [mx] }) => {
    if (appState !== 'playing' || phase !== 'idle') return
    
    // Trigger spin when drag ends
    if (!active) { 
      // It's a valid swipe if useGesture detected a swipe, OR if dragged > 20px
      if (swipeX !== 0 || Math.abs(mx) > 20) {
        // Base speed ensures it spins even with a light swipe or if paused before release
        const baseVx = Math.max(Math.abs(vx), Math.abs(mx) / 100)
        const speed = Math.min(baseVx * 25 + 20, 60)
        
        // Direction based on swipeX or movement
        const dir = swipeX !== 0 ? Math.sign(swipeX) : Math.sign(mx)
        
        angularVelocity.current = speed * dir
        setPhase('spinning')
      }
    }
  }, { filterTaps: true })

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (phase === 'spinning') {
      const damping = 0.992 // Lower friction = spins longer
      
      // Apply rotation
      groupRef.current.rotation.y += angularVelocity.current * delta
      
      // Apply friction
      angularVelocity.current *= damping

      // Wobble effect as it slows down (reduced threshold so it wobbles less time)
      const absVelocity = Math.abs(angularVelocity.current)
      if (absVelocity < 6 && absVelocity > 0.1) {
        wobblePhase.current += delta * 15
        const wobbleIntensity = (6 - absVelocity) * 0.04
        groupRef.current.rotation.x = Math.sin(wobblePhase.current) * wobbleIntensity
        groupRef.current.rotation.z = Math.cos(wobblePhase.current) * wobbleIntensity
      }

      // Stop condition
      if (absVelocity < 0.15) {
        setPhase('falling')
        angularVelocity.current = 0
        fallProgress.current = 0
        
        // Calculate Snap Y immediately
        const currentRot = groupRef.current.rotation.y
        const snapAngle = Math.PI / 3 // 60 degrees
        const faceOffset = Math.PI / 6 
        
        targetSnapY.current = Math.round((currentRot - faceOffset) / snapAngle) * snapAngle + faceOffset
        startFallX.current = groupRef.current.rotation.x
        startFallZ.current = groupRef.current.rotation.z
        startFallPosY.current = groupRef.current.position.y
      }
    } else if (phase === 'falling') {
      // Animate the fall
      fallProgress.current += delta * 3 // 0.33 seconds to fall
      const t = Math.min(fallProgress.current, 1)
      
      // Acceleration curve for gravity feel
      const ease = t * t * t
      
      groupRef.current.rotation.y = targetSnapY.current // Snap Y immediately so it aligns perfectly flat
      groupRef.current.rotation.x = THREE.MathUtils.lerp(startFallX.current, -Math.PI / 2, ease)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(startFallZ.current, 0, ease)
      
      // Target Y so face hits Mesa: 1.299 - 0.5 = 0.799
      const targetPosY = 0.799
      groupRef.current.position.y = THREE.MathUtils.lerp(startFallPosY.current, targetPosY, ease)

      if (t === 1) {
        setPhase('waiting')
        
        // Determine winning face
        const degY = (targetSnapY.current * 180 / Math.PI) % 360
        let index = Math.round((150 - degY) / 60) % 6
        if (index < 0) index += 6
        
        // Wait 1.5 seconds before showing the result banner
        setTimeout(() => {
          onResult(FACES[index])
        }, 1500)
      }
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
        // Offset by Math.PI / 6 so texts sit on the flat faces instead of the vertices
        const angle = i * (Math.PI / 3) + (Math.PI / 6)
        // Position slightly outside the cylinder radius
        // The distance from center to face of a hexagon is radius * cos(30 deg)
        const faceDistance = bodyRadius * Math.cos(Math.PI / 6) + 0.05
        const x = Math.sin(angle) * faceDistance
        const z = Math.cos(angle) * faceDistance
        
        return (
          <Text
            key={i}
            position={[x, 0, z]}
            rotation={[0, angle, 0]}
            fontSize={0.25}
            color="#3E2723"
            anchorX="center"
            anchorY="middle"
            maxWidth={faceDistance * 1.5}
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
