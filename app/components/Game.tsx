'use client';

import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { handleKeyPress } from '../store/thunks';
import InputController from './InputController';
import ChatView from './ChatView';
import NavigationView from './NavigationView';

export default function Game() {
  const dispatch = useAppDispatch();

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
      <ChatView />
      <NavigationView />
    </>
  );
}
