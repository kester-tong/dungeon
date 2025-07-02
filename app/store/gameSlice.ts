import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gameConfig } from '@/src/config/gameConfig';
import {
  AsyncAction,
  GameEvent,
  GameState,
} from '@/src/engine/types';

const initialState: GameState = {
  player: gameConfig.startingPosition,
  chatWindow: null,
  inventory: gameConfig.initialInventory,
  splashText: gameConfig.initialSplashText,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setState: (
      state,
      action: PayloadAction<{
        state: GameState;
        event: GameEvent;
        actions: AsyncAction[];
      }>
    ) => {
      return action.payload.state;
    },
  },
});

export const { setState } = gameSlice.actions;

export default gameSlice.reducer;