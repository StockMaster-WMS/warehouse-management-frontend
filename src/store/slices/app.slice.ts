import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  appName: string;
  initialized: boolean;
}

const initialState: AppState = {
  appName: "StockMaster WMS",
  initialized: true,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppName(state, action: PayloadAction<string>) {
      state.appName = action.payload;
    },
  },
});

export const { setAppName } = appSlice.actions;
export const appReducer = appSlice.reducer;
