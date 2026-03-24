"use client";

import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "@/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        richColors
        position="top-center"
        closeButton
        expand={false}
        duration={4500}
        toastOptions={{
          classNames: {
            toast: "font-sans text-sm",
            title: "font-semibold",
            description: "text-[0.8125rem] opacity-90",
          },
        }}
      />
    </Provider>
  );
}
