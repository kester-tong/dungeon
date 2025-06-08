'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { handleKeyPress } from '../store/thunks';
import { selectChatWindowText, selectTileArray } from '../store/selectors';
import InputController from './InputController';
import { Renderer } from './Renderer';

export default function Game() {
  const dispatch = useAppDispatch();
  const tileArray = useAppSelector(selectTileArray);
  const chatText = useAppSelector(selectChatWindowText);

  // Handle keyboard input via InputController
  const onKeyDown = useCallback(
    (key: string) => {
      dispatch(handleKeyPress({ key }));
    },
    [dispatch]
  );

  return (
    <>
      <InputController onKeyDown={onKeyDown} />
      <main style={{ padding: '1rem' }}>
        {tileArray && (
          <Renderer
            tileArray={tileArray}
            textBoxes={chatText ? [
              { text: chatText, startx: 2, starty: 2, endx: 23, endy: 13 },
            ] : []}
            width={800}
            height={480}
          />
        )}
      </main>
    </>
  );
}
