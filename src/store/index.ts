import { configureStore } from "@reduxjs/toolkit";
import { appReducer } from "@/store/slices/app.slice";
import { baseApi } from "@/store/services/api";
import "@/store/services/purchase-order.service";
import "@/store/services/supplier.service";
import "@/store/services/warehouse.service";
import "@/store/services/location.service";
import "@/store/services/stock.service";
import "@/store/services/dashboard.service";

export const store = configureStore({
  reducer: {
    app: appReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore RTK Query actions which may contain non-serializable data (Blobs for Excel export)
        ignoredActions: ["api/executeMutation/fulfilled", "api/executeQuery/fulfilled"],
        ignoredPaths: ["api"],
      },
    }).concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
