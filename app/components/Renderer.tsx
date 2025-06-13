'use client';

import React, { useRef, useEffect } from 'react';
import { useTileset } from './TilesetProvider';
import { Tileset } from '@/src/tileset';

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

/**
 * View represents the complete view to be rendered including tiles and overlays
 */
export interface View {
  tileArray: TileArray;
  textBoxes: TextBox[];
}

/**
 * Represents a text segment with optional color
 */
export interface TextSegment {
  text: string;
  color?: string; // CSS color value, defaults to white if not specified
}

/**
 * TextBox represents a text box that is overlaid on the TileArray
 */
export interface TextBox {
  // Coordinates in tile coordinates so one unit is the tile width/height
  // Start is inclusive end is exclusive.
  startx: number;
  starty: number;
  endx: number;
  endy: number;
  text: TextSegment[];
  scrollOffset?: number; // Number of lines to scroll from the bottom (0 = show bottom)
  borderColor?: string; // Optional border color, no border if not provided
  backgroundColor?: string; // Optional background color, defaults to 'rgba(0, 0, 0, 0.8)'
}

interface RendererProps {
  view: View;
  width: number;
  height: number;
}

function renderTextBox(
  ctx: CanvasRenderingContext2D,
  textBox: TextBox,
  tileSize: number
) {
  const {
    startx,
    starty,
    endx,
    endy,
    text,
    scrollOffset = 0,
    borderColor,
    backgroundColor,
  } = textBox;

  // Convert tile coordinates to pixel coordinates
  const pixelX = startx * tileSize;
  const pixelY = starty * tileSize;
  const pixelWidth = (endx - startx) * tileSize;
  const pixelHeight = (endy - starty) * tileSize;

  // Draw background if specified or default
  if (backgroundColor !== undefined) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
  } else if (borderColor) {
    // Only draw default background if there's a border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
  }

  // Draw border only if borderColor is specified
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(pixelX + 0.5, pixelY + 0.5, pixelWidth - 1, pixelHeight - 1);
  }

  // Set up text properties
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Add padding
  const padding = 4;
  const textX = pixelX + padding;
  const textY = pixelY + padding;
  const textWidth = pixelWidth - padding * 2;
  const textHeight = pixelHeight - padding * 2;

  // Process each text segment and word wrap within each segment
  interface ColoredLine {
    text: string;
    color: string;
  }

  const lines: ColoredLine[] = [];

  for (const segment of text) {
    const paragraphs = segment.text.split('\n');
    const color = segment.color || '#fff';

    for (const paragraph of paragraphs) {
      if (paragraph === '') {
        lines.push({ text: '', color });
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        ctx.fillStyle = color; // Set color for measurement
        const metrics = ctx.measureText(testLine);

        if (metrics.width > textWidth && currentLine) {
          lines.push({ text: currentLine, color });
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push({ text: currentLine, color });
      }
    }
  }

  // Calculate scrolling
  const lineHeight = 14;
  const maxVisibleLines = Math.floor(textHeight / lineHeight);
  const totalLines = lines.length;

  // Determine which lines to display based on scroll offset
  let startLine = 0;
  let endLine = totalLines;

  if (totalLines > maxVisibleLines) {
    endLine = totalLines - scrollOffset;
    startLine = Math.max(0, endLine - maxVisibleLines);
    endLine = Math.min(totalLines, startLine + maxVisibleLines);
  }

  // Set up clipping to prevent text from rendering outside the text box
  ctx.save();
  ctx.beginPath();
  ctx.rect(textX, textY, textWidth, textHeight);
  ctx.clip();

  // Draw visible lines with their colors
  for (let i = startLine; i < endLine; i++) {
    const line = lines[i];
    const lineY = textY + (i - startLine) * lineHeight;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, textX, lineY);
  }

  ctx.restore();
}

function renderTiles(
  ctx: CanvasRenderingContext2D,
  tiles: TileArray,
  tileset: Tileset
) {
  for (let y = 0; y < tiles.tiles.length; y++) {
    for (let x = 0; x < tiles.tiles[y].length; x++) {
      const tileSize = tileset.getTileSize();
      const pixelX = x * tileSize;
      const pixelY = y * tileSize;

      // Render each layer in order (bottom to top)
      for (const tileIndex of tiles.tiles[y][x]) {
        tileset.drawTile(ctx, tileIndex, pixelX, pixelY);
      }
    }
  }
}

function renderView(
  ctx: CanvasRenderingContext2D,
  view: View,
  width: number,
  height: number,
  tileset: Tileset
) {
  // Clear the canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // Render each tile
  renderTiles(ctx, view.tileArray, tileset);
  view.textBoxes.forEach((textBox) =>
    renderTextBox(ctx, textBox, tileset.getTileSize())
  );
}

export function Renderer({ view, width, height }: RendererProps) {
  const { tileset } = useTileset();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!tileset) return;

    renderView(ctx, view, height, width, tileset);
  }, [tileset, view, height, width]);

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
