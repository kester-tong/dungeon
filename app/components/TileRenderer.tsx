'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useTileset } from './TilesetProvider';

/**
 * TileArray represents a tile-based view to be rendered.
 */
export interface TileArray {
  /**
   * 3D array of tile indices where:
   * - First dimension [y]: rows (top to bottom)
   * - Second dimension [x]: columns (left to right)
   * - Third dimension [layer]: stacked tile indices at position (x,y), ordered from bottom to top
   */
  tiles: number[][][];
}

interface TileRendererProps {
  tileArray: TileArray;
  width: number;
  height: number;
}

export function TileRenderer({ tileArray, width, height }: TileRendererProps) {
  const { tileset } = useTileset();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTileArrayRef = useRef<TileArray | null>(null);

  const renderTileLayers = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      tileIndices: number[]
    ) => {
      if (!tileset) return;
      const tileSize = tileset.getTileSize();
      const pixelX = x * tileSize;
      const pixelY = y * tileSize;

      // Render each layer in order (bottom to top)
      for (const tileIndex of tileIndices) {
        tileset.drawTile(ctx, tileIndex, pixelX, pixelY);
      }
    },
    [tileset]
  );

  const renderFullTileArray = useCallback(
    (ctx: CanvasRenderingContext2D, tiles: TileArray) => {
      // Clear the canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // Render each tile
      for (let y = 0; y < tiles.tiles.length; y++) {
        for (let x = 0; x < tiles.tiles[y].length; x++) {
          renderTileLayers(ctx, x, y, tiles.tiles[y][x]);
        }
      }
    },
    [width, height, renderTileLayers]
  );

  const areTileLayersEqual = useCallback(
    (indices1: number[], indices2: number[]): boolean => {
      if (indices1.length !== indices2.length) {
        return false;
      }

      for (let i = 0; i < indices1.length; i++) {
        if (indices1[i] !== indices2[i]) {
          return false;
        }
      }

      return true;
    },
    []
  );

  const renderTileArrayDiff = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      newTiles: TileArray,
      currentTiles: TileArray
    ) => {
      if (!tileset) return;
      const tileSize = tileset.getTileSize();

      for (let y = 0; y < newTiles.tiles.length; y++) {
        for (let x = 0; x < newTiles.tiles[y].length; x++) {
          if (
            !areTileLayersEqual(newTiles.tiles[y][x], currentTiles.tiles[y][x])
          ) {
            // Clear this tile position with black
            ctx.fillStyle = '#000';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

            // Render the new tile layers
            renderTileLayers(ctx, x, y, newTiles.tiles[y][x]);
          }
        }
      }
    },
    [tileset, areTileLayersEqual, renderTileLayers]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize currentTileArray if it's null
    if (!currentTileArrayRef.current) {
      currentTileArrayRef.current = JSON.parse(JSON.stringify(tileArray));
      renderFullTileArray(ctx, tileArray);
      return;
    }

    const currentTileArray = currentTileArrayRef.current;

    // Ensure dimensions match or default to full render
    if (
      tileArray.tiles.length !== currentTileArray.tiles.length ||
      tileArray.tiles[0].length !== currentTileArray.tiles[0].length
    ) {
      currentTileArrayRef.current = JSON.parse(JSON.stringify(tileArray));
      renderFullTileArray(ctx, tileArray);
      return;
    }

    // Perform diffing and update only changed tiles
    renderTileArrayDiff(ctx, tileArray, currentTileArray);

    // Update the current tile array
    currentTileArrayRef.current = JSON.parse(JSON.stringify(tileArray));
  }, [tileset, tileArray, renderFullTileArray, renderTileArrayDiff]);

  // Don't render if tileset isn't loaded yet
  if (!tileset) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: '2px solid #333',
        backgroundColor: '#000',
        imageRendering: 'pixelated',
      }}
    />
  );
}
