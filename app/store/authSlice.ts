import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  accessKey: string | null;
}

const initialState: AuthState = {
  accessKey: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessKey: (state, action: PayloadAction<string | null>) => {
      state.accessKey = action.payload;
    },
    clearAccessKey: (state) => {
      state.accessKey = null;
    },
  },
});

export const { setAccessKey, clearAccessKey } = authSlice.actions;
export default authSlice.reducer;
