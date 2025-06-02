'use client'

import React, { createContext, useContext, useRef, useState, useEffect } from 'react'

interface TilesetContextType {
  imageRef: React.MutableRefObject<HTMLImageElement | null>;
  loaded: boolean;
}

const TilesetContext = createContext<TilesetContextType | null>(null)

interface TilesetProviderProps {
  children: React.ReactNode;
  imageUrl: string;
}

export function TilesetProvider({ 
  children, 
  imageUrl 
}: TilesetProviderProps) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Create and load the tileset image
    const image = new Image()
    
    image.onload = () => {
      console.log('Tileset loaded:', imageUrl)
      setLoaded(true)
    }
    
    image.onerror = (err) => {
      console.error('Failed to load tileset:', imageUrl, err)
      setLoaded(false)
    }
    
    image.src = imageUrl
    imageRef.current = image
    
    return () => {
      // Cleanup
      if (imageRef.current) {
        imageRef.current.onload = null
        imageRef.current.onerror = null
      }
    }
  }, [imageUrl])

  const contextValue: TilesetContextType = {
    imageRef,
    loaded
  }

  return (
    <TilesetContext.Provider value={contextValue}>
      {children}
    </TilesetContext.Provider>
  )
}

export function useTileset(): TilesetContextType {
  const context = useContext(TilesetContext)
  if (!context) {
    throw new Error('useTileset must be used within a TilesetProvider')
  }
  return context
}