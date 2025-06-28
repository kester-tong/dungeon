'use client';

import React, { useRef, useEffect } from 'react';
import { useTileset } from './TilesetProvider';
import { renderView } from './rendering';
import styles from './Renderer.module.css';

export interface TileArray {
  tiles: number[][][];
}

export interface View {
  tileArray: TileArray;
  textBoxes: TextBox[];
}

export interface TextSegment {
  text: string;
  color?: string;
}

export interface TextBox {
  startx: number;
  starty: number;
  endx: number;
  endy: number;
  text: TextSegment[];
  scrollOffset?: number;
  borderColor?: string;
  backgroundColor?: string;
}

interface RendererProps {
  view: View;
}

export function Renderer({ view }: RendererProps) {
  const { tileset } = useTileset();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const height = view.tileArray.tiles.length * (tileset?.getTileSize() || 0);
  const width = view.tileArray.tiles[0].length * (tileset?.getTileSize() || 0);

  useEffect(() => {
    if (!canvasRef.current || !tileset) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderView(ctx, view, height, width, tileset);
  }, [tileset, view, height, width]);

  if (!tileset) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={styles.canvas}
    />
  );
}
