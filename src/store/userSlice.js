import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    isAuthenticated: false,
    isInitialized: false,
  },
  reducers: {
    setUser(state, action) {
      const raw = action.payload;
      if (!raw) {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        return;
      }
      state.user = JSON.parse(JSON.stringify(raw));
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    setInitialized(state) {
      state.isInitialized = true;
    },
  },
});

export const { setUser, clearUser, setInitialized } = userSlice.actions;
export default userSlice.reducer;
