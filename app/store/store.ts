import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import authReducer from './authSlice';
import { listenerMiddleware } from './middleware';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
