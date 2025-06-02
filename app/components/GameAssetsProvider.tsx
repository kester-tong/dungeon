'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Map } from '../../src/maps/Map'
import { loadMap } from '../../src/maps/loader'
import { gameConfig } from '../src/config/gameConfig'

interface GameAssetsContextType {
  map: Map | null;
  loaded: boolean;
  error: string | null;
}

const GameAssetsContext = createContext<GameAssetsContextType | null>(null)

interface GameAssetsProviderProps {
  children: React.ReactNode;
}

export function GameAssetsProvider({ 
  children 
}: GameAssetsProviderProps) {
  const [map, setMap] = useState<Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGameMap() {
      try {
        setError(null)
        const loadedMap = await loadMap(gameConfig.mapUrl)
        setMap(loadedMap)
        setLoaded(true)
        console.log('Map loaded:', gameConfig.mapUrl, `${loadedMap.width}x${loadedMap.height}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading map'
        console.error('Error loading map:', errorMessage)
        setError(errorMessage)
        setLoaded(false)
      }
    }

    loadGameMap()
  }, [])

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