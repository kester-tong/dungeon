import { createAsyncThunk } from '@reduxjs/toolkit';
import { GameEvent } from '@/src/engine/types';
import { handleEvent } from '@/src/engine/engine';
import { setState } from './gameSlice';
import type { RootState } from './store';
import { ChatResponse } from '../api/chat/types';

export const processGameEvent = createAsyncThunk(
  'game/processGameEvent',
  async (event: GameEvent, { dispatch, getState }) => {
    const currentState = (getState() as RootState).game;

    // 1. Get new state and actions from the synchronous engine
    const { state: newState, actions } = handleEvent(
      currentState,
      event
    );

    // 2. Dispatch the new state to the store immediately
    dispatch(setState(newState));

    // 3. Handle all async actions returned by the engine
    for (const action of actions) {
      switch (action.type) {
        case 'send_chat_request':
          const state = getState() as RootState;
          const accessKey = state.auth.accessKey;
          const requestBody = {
            accessKey,
            npcId: newState.chatWindow?.npcId,
            contents: newState.chatWindow?.contents,
          };
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          const chatResponse: ChatResponse = await response.json();
          // RECURSION: Dispatch a new event with the result
          dispatch(
            processGameEvent({ type: 'chatresponse', response: chatResponse })
          );
          break;

        case 'start_timer':
          setTimeout(() => {
            // RECURSION: Dispatch a new event when the timer is up
            dispatch(processGameEvent({ type: 'timerelapsed' }));
          }, action.duration);
          break;
      }
    }
  }
);

export const handleKeyPress = createAsyncThunk(
  'game/handleKeyPress',
  async (params: { key: string }, { dispatch }) => {
    const { key } = params;
    dispatch(processGameEvent({ type: 'keydown', key }));
  }
);