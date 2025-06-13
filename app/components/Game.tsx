'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { handleKeyPress } from '../store/thunks';
import { selectView } from '../store/selectors';
import InputController from './InputController';
import { Renderer } from './Renderer';

export default function Game() {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView);

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
        {view && <Renderer view={view} />}
      </main>
    </>
  );
}
