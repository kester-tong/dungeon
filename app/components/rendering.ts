'use client';

import { Tileset } from '@/src/tileset';
import { TileArray, View, TextBox } from './Renderer';

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

  const pixelX = startx * tileSize;
  const pixelY = starty * tileSize;
  const pixelWidth = (endx - startx) * tileSize;
  const pixelHeight = (endy - starty) * tileSize;

  if (backgroundColor !== undefined) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
  } else if (borderColor) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
  }

  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(pixelX + 0.5, pixelY + 0.5, pixelWidth - 1, pixelHeight - 1);
  }

  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const padding = 4;
  const textX = pixelX + padding;
  const textY = pixelY + padding;
  const textWidth = pixelWidth - padding * 2;
  const textHeight = pixelHeight - padding * 2;

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
        ctx.fillStyle = color;
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

  const lineHeight = 14;
  const maxVisibleLines = Math.floor(textHeight / lineHeight);
  const totalLines = lines.length;

  let startLine = 0;
  let endLine = totalLines;

  if (totalLines > maxVisibleLines) {
    endLine = totalLines - scrollOffset;
    startLine = Math.max(0, endLine - maxVisibleLines);
    endLine = Math.min(totalLines, startLine + maxVisibleLines);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(textX, textY, textWidth, textHeight);
  ctx.clip();

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

      for (const tileIndex of tiles.tiles[y][x]) {
        tileset.drawTile(ctx, tileIndex, pixelX, pixelY);
      }
    }
  }
}

export function renderView(
  ctx: CanvasRenderingContext2D,
  view: View,
  width: number,
  height: number,
  tileset: Tileset
) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, height, width);

  renderTiles(ctx, view.tileArray, tileset);
  view.textBoxes.forEach((textBox) =>
    renderTextBox(ctx, textBox, tileset.getTileSize())
  );
}
