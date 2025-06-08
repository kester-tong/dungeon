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
}

interface RendererProps {
  view: View;
  width: number;
  height: number;
}

/**
 * Returns true if the given tile is contained within any of the text boxes
 *
 * @param x x coordinate
 * @param y y coordinate
 * @param textBoxes The set of text boxes
 */
function isContainedInTextBoxes(x: number, y: number, textBoxes: TextBox[]) {
  return textBoxes.some(
    ({ startx, starty, endx, endy }) =>
      startx <= x && x < endx && starty <= y && y < endy
  );
}

function renderTextBox(
  ctx: CanvasRenderingContext2D,
  textBox: TextBox,
  tileSize: number
) {
  const { startx, starty, endx, endy, text, scrollOffset = 0 } = textBox;

  // Convert tile coordinates to pixel coordinates
  const pixelX = startx * tileSize;
  const pixelY = starty * tileSize;
  const pixelWidth = (endx - startx) * tileSize;
  const pixelHeight = (endy - starty) * tileSize;

  // Draw background with slight transparency
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);

  // Draw border strictly within tile boundaries
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.strokeRect(pixelX + 0.5, pixelY + 0.5, pixelWidth - 1, pixelHeight - 1);

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

export function Renderer({ view, width, height }: RendererProps) {
  const { tileset } = useTileset();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Props from the last render so we can render just the parts that changed.
  const previousPropsRef = useRef<RendererProps | null>(null);

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
      if (tileset) {
        view.textBoxes.forEach((textBox) =>
          renderTextBox(ctx, textBox, tileset.getTileSize())
        );
      }
    },
    [width, height, renderTileLayers, tileset, view.textBoxes]
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

  const renderViewDiff = useCallback(
    (ctx: CanvasRenderingContext2D, currentView: View, previousView: View) => {
      if (!tileset) return;
      const tileSize = tileset.getTileSize();

      for (let y = 0; y < currentView.tileArray.tiles.length; y++) {
        for (let x = 0; x < currentView.tileArray.tiles[y].length; x++) {
          if (
            !areTileLayersEqual(
              currentView.tileArray.tiles[y][x],
              previousView.tileArray.tiles[y][x]
            ) ||
            isContainedInTextBoxes(x, y, previousView.textBoxes) ||
            isContainedInTextBoxes(x, y, currentView.textBoxes)
          ) {
            // Clear this tile position with black
            ctx.fillStyle = '#000';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

            // Render the new tile layers
            renderTileLayers(ctx, x, y, currentView.tileArray.tiles[y][x]);
          }
        }
      }
      if (tileset) {
        currentView.textBoxes.forEach((textBox) =>
          renderTextBox(ctx, textBox, tileset.getTileSize())
        );
      }
    },
    [tileset, areTileLayersEqual, renderTileLayers]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize if it's null
    if (!previousPropsRef.current) {
      previousPropsRef.current = { view, width, height };
      renderFullTileArray(ctx, view.tileArray);
      return;
    }

    const { view: previousView } = previousPropsRef.current;

    // Ensure dimensions match or default to full render
    if (
      view.tileArray.tiles.length !== previousView.tileArray.tiles.length ||
      view.tileArray.tiles[0].length !== previousView.tileArray.tiles[0].length
    ) {
      previousPropsRef.current = { view, width, height };
      renderFullTileArray(ctx, view.tileArray);
      return;
    }

    // Perform diffing and update only changed tiles
    renderViewDiff(ctx, view, previousView);

    // Update the current view
    previousPropsRef.current = { view, width, height };
  }, [tileset, view, height, width, renderFullTileArray, renderViewDiff]);

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
