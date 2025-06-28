'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { handleKeyPress } from '../store/thunks';
import { selectView } from '../store/selectors';
import InputController from './InputController';
import { Renderer } from './Renderer';
import styles from './Game.module.css';

export default function Game() {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView);

  const onKeyDown = useCallback(
    (key: string) => {
      dispatch(handleKeyPress({ key }));
    },
    [dispatch]
  );

  return (
    <main className={styles.container}>
      <InputController onKeyDown={onKeyDown} />
      {view && <Renderer view={view} />}
    </main>
  );
}
