'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tileset } from '@/src/tileset';
import { gameConfig } from '@/src/config/gameConfig';

interface TilesetContextType {
  tileset: Tileset | null;
  loaded: boolean;
}

const TilesetContext = createContext<TilesetContextType | null>(null);

interface TilesetProviderProps {
  children: React.ReactNode;
}

export function TilesetProvider({ children }: TilesetProviderProps) {
  const [tileset, setTileset] = useState<Tileset | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Create and load the tileset image
    const image = new Image();

    image.onload = () => {
      console.log('Tileset loaded:', gameConfig.tileset.imagePath);
      const newTileset = new Tileset(image, gameConfig.tileset);
      setTileset(newTileset);
      setLoaded(true);
    };

    image.onerror = (err) => {
      console.error(
        'Failed to load tileset:',
        gameConfig.tileset.imagePath,
        err
      );
      setTileset(null);
      setLoaded(false);
    };

    image.src = gameConfig.tileset.imagePath;

    return () => {
      // Cleanup
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  const contextValue: TilesetContextType = {
    tileset,
    loaded,
  };

  return (
    <TilesetContext.Provider value={contextValue}>
      {children}
    </TilesetContext.Provider>
  );
}

export function useTileset(): TilesetContextType {
  const context = useContext(TilesetContext);
  if (!context) {
    throw new Error('useTileset must be used within a TilesetProvider');
  }
  return context;
}
