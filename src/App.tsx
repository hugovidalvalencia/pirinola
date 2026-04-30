import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei'
import Pirinola from './Pirinola'

function App() {
  const [appState, setAppState] = useState<'start' | 'playing' | 'result'>('start')
  const [resultText, setResultText] = useState('')

  const handleStart = () => {
    setAppState('playing')
  }

  const handleResult = (text: string) => {
    setResultText(text)
    setAppState('result')
  }

  const handleRestart = () => {
    setAppState('playing')
    setResultText('')
  }

  return (
    <div className="relative w-screen h-screen bg-stone-900 overflow-hidden touch-none select-none">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 5, 10], fov: 45 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={2048} />
        <Environment preset="city" />
        
        {/* Mesa */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#8B5A2B" roughness={0.8} />
        </mesh>
        
        <ContactShadows position={[0, -0.49, 0]} opacity={0.6} scale={10} blur={2} far={4} />

        <Pirinola 
          appState={appState} 
          onResult={handleResult} 
        />
      </Canvas>

      {/* UI Overlay */}
      {appState === 'start' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="text-center px-4">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-8 tracking-widest drop-shadow-lg">PIRINOLA</h1>
            <button 
              onClick={handleStart}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold text-lg sm:text-xl transition-all shadow-[0_0_15px_rgba(234,88,12,0.5)] active:scale-95"
            >
              Iniciar Juego
            </button>
          </div>
        </div>
      )}

      {appState === 'playing' && (
        <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none z-10 px-4">
          <p className="text-white/80 text-xs sm:text-sm tracking-widest uppercase bg-black/30 px-4 py-2 rounded-full backdrop-blur-md text-center">
            Desliza la pirinola para girar
          </p>
        </div>
      )}

      {appState === 'result' && (
        <div className="absolute top-1/4 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4">
          <div className="bg-white/95 backdrop-blur-md px-6 sm:px-12 py-6 rounded-3xl shadow-2xl border border-white/20 text-center pointer-events-auto max-w-full">
            <h2 className="text-3xl sm:text-4xl font-black text-stone-800 uppercase tracking-tighter mb-4 break-words">
              {resultText}
            </h2>
            <button 
              onClick={handleRestart}
              className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-full font-bold text-sm transition-all active:scale-95"
            >
              Tirar de nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
