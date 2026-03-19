import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "@/store/slices/app.slice";
import { baseApi } from "@/store/services/api";

export const store = configureStore({
  reducer: {
    app: appReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
