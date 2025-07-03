import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { gameConfig } from '@/src/config/gameConfig';
import { GameState } from '@/src/state';
import { GameEvent, AsyncAction } from '@/src/engine';

const initialState: GameState = {
  player: gameConfig.startingPosition,
  splashText: gameConfig.initialSplashText,
  inventory: gameConfig.initialInventory,
  chatWindow: null,
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