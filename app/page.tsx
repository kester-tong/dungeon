'use client'

import { useEffect } from 'react'
import { useTileset } from './components/TilesetProvider'

export default function Home() {
  const { imageRef, loaded } = useTileset()

  useEffect(() => {
    console.log('Game page loaded - ready for game engine migration')
    console.log('Tileset loaded:', loaded)
    if (loaded && imageRef.current) {
      console.log('Tileset image dimensions:', imageRef.current.width, 'x', imageRef.current.height)
    }
  }, [loaded, imageRef])

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Dungeon Game</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <h3>Tileset Status:</h3>
        <p>Loaded: {loaded ? '✅ Yes' : '⏳ Loading...'}</p>
        {loaded && imageRef.current && (
          <p>Dimensions: {imageRef.current.width} x {imageRef.current.height}px</p>
        )}
      </div>
      
      <div style={{ 
        border: '2px solid #333', 
        width: '800px', 
        height: '480px', 
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'monospace',
        flexDirection: 'column'
      }}>
        <div>Game Canvas Will Go Here</div>
        <div>(Migration Pending)</div>
        {loaded && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#ccc' }}>
            Tileset Ready for Rendering!
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
        <p>Controls: WASD or Arrow Keys to move, ESC to exit chat</p>
      </div>
    </main>
  )
}