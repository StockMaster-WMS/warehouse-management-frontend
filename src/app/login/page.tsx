"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasExplicitLogoutSnapshot, saveToken } from "@/lib/auth-token";
import { useAppDispatch } from "@/store/hooks";
import { baseApi } from "@/store/services/api";
import { useLoginMutation, useRefreshTokenMutation } from "@/store/services/auth.service";
import { Warehouse, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isEmail, setIsEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading, error }] = useLoginMutation();
  const [refreshToken] = useRefreshTokenMutation();

  useEffect(() => {
    if (hasExplicitLogoutSnapshot()) {
      return;
    }

    let cancelled = false;

    refreshToken()
      .unwrap()
      .then((result) => {
        if (cancelled) return;
        const token = saveToken(result.accessToken);
        if (!token) return;
        dispatch(baseApi.util.resetApiState());
        router.replace("/dashboard");
      })
      .catch(() => {
        // No refresh cookie/session: stay on login.
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, refreshToken, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const credentials = isEmail
        ? { email: username, password }
        : { username, password };

      const result = await login(credentials).unwrap();
      const token = saveToken(result.accessToken);

      if (!token) {
        throw new Error("Login response missing accessToken");
      }

      dispatch(baseApi.util.resetApiState());
      router.replace("/dashboard");
    } catch {
      // Error handled by redux state
    }
  };

  return (
    <main className="relative flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/30">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-blue-400/30 to-cyan-400/30 blur-3xl animate-pulse" />
        <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 blur-3xl animate-pulse delay-1000" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl place-items-center p-4">
        <section className="w-full max-w-md">
          <Card className="rounded-2xl border-border/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl sm:px-6">
            <CardHeader className="space-y-4 px-0 pb-4">
              {/* Logo Section */}
              <div className="flex flex-col items-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                  <Warehouse className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    StockMaster
                  </CardTitle>
                  <CardDescription className="mt-2 whitespace-nowrap">
                    Nhập thông tin tài khoản để truy cập hệ thống quản lý kho.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isEmail ? "Email" : "Tên đăng nhập"}
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsEmail(!isEmail)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline"
                    >
                      {isEmail ? "Dùng username" : "Dùng email"}
                    </button>
                  </div>
                  <Input
                    id="username"
                    name={isEmail ? "email" : "username"}
                    type={isEmail ? "email" : "text"}
                    placeholder={isEmail ? "admin@example.com" : "admin"}
                    autoComplete={isEmail ? "email" : "username"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu</Label>
                    <Link
                      href="#"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                    {typeof error === "object" && "data" in error 
                      ? ((error.data as { message?: string })?.message || "Đăng nhập thất bại")
                      : "Đăng nhập thất bại"}
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="mt-2 w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
                Chưa có tài khoản?{" "}
                <Link href="#" className="font-medium text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline">
                  Liên hệ quản trị viên
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
            <p>Copyright © 2026 StockMaster WMS. All rights reserved.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
