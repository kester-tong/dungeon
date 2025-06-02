'use client'

import React, { useRef, useEffect } from 'react'
import { Tileset } from '../../src/tileset'

interface TestCanvasProps {
  tileset: Tileset | null;
  width: number;
  height: number;
}

export function TestCanvas({ tileset, width, height }: TestCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!tileset || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw some random tiles for testing
    const tileSize = tileset.getTileSize()
    const tilesX = Math.floor(width / tileSize)
    const tilesY = Math.floor(height / tileSize)

    // Create a simple pattern with some random tiles
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        let tileIndex: number
        
        // Create a simple pattern
        if (x === 0 || x === tilesX - 1 || y === 0 || y === tilesY - 1) {
          // Border walls
          tileIndex = 21
        } else if (Math.random() < 0.1) {
          // Random obstacles
          tileIndex = Math.random() < 0.5 ? 71 : 73
        } else {
          // Terrain
          tileIndex = 2
        }

        tileset.drawTile(ctx, tileIndex, x * tileSize, y * tileSize)
      }
    }
  }, [tileset, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: '2px solid #333',
        backgroundColor: '#000',
        imageRendering: 'pixelated'
      }}
    />
  )
}