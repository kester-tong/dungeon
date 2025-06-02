'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Map } from '../../src/maps/Map'
import { loadMap } from '../../src/maps/loader'

interface GameAssetsContextType {
  map: Map | null;
  loaded: boolean;
  error: string | null;
}

const GameAssetsContext = createContext<GameAssetsContextType | null>(null)

interface GameAssetsProviderProps {
  children: React.ReactNode;
  mapUrl: string;
}

export function GameAssetsProvider({ 
  children, 
  mapUrl 
}: GameAssetsProviderProps) {
  const [map, setMap] = useState<Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGameMap() {
      try {
        setError(null)
        const loadedMap = await loadMap(mapUrl)
        setMap(loadedMap)
        setLoaded(true)
        console.log('Map loaded:', mapUrl, `${loadedMap.width}x${loadedMap.height}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading map'
        console.error('Error loading map:', errorMessage)
        setError(errorMessage)
        setLoaded(false)
      }
    }

    loadGameMap()
  }, [mapUrl])

  const contextValue: GameAssetsContextType = {
    map,
    loaded,
    error
  }

  return (
    <GameAssetsContext.Provider value={contextValue}>
      {children}
    </GameAssetsContext.Provider>
  )
}

export function useGameAssets(): GameAssetsContextType {
  const context = useContext(GameAssetsContext)
  if (!context) {
    throw new Error('useGameAssets must be used within a GameAssetsProvider')
  }
  return context
}