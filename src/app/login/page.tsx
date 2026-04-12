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
import { normalizeAccessToken } from "@/lib/auth-token";
import { useLoginMutation } from "@/store/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isEmail, setIsEmail] = useState(false);
  const [login, { isLoading, error }] = useLoginMutation();

  // Redirect if token already exists
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const credentials = isEmail
        ? { email: username, password }
        : { username, password };

      const result = await login(credentials).unwrap();
      const accessToken = normalizeAccessToken(result.accessToken);

      if (!accessToken) {
        throw new Error("Login response missing accessToken");
      }
      
      // Lưu accessToken vào localStorage
      // RefreshToken sẽ được backend set vào HttpOnly cookie (tự động gửi, JS không thể access)
      localStorage.setItem("accessToken", accessToken);
      
      // Thông báo cho AuthGuard về sự thay đổi token (quan trọng cho useSyncExternalStore)
      window.dispatchEvent(new Event("auth-token-changed"));
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch {
      // Error đã được render từ `error` state ở UI.
    }
  };

  return (
    <main className="relative flex min-h-svh w-full items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl place-items-center">
        <section className="w-full max-w-md">
          <Card className="rounded-2xl border-border/80 bg-card/95 shadow-lg sm:px-6">
            <CardHeader className="space-y-2 px-0">
              <CardTitle className="text-2xl font-semibold tracking-tight">Đăng nhập</CardTitle>
              <CardDescription>
                Nhập thông tin tài khoản để truy cập hệ thống quản lý kho.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username">
                      {isEmail ? "Email" : "Tên đăng nhập"}
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsEmail(!isEmail)}
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
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
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Link
                      href="#"
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {typeof error === "object" && "data" in error 
                      ? ((error.data as { message?: string })?.message || "Đăng nhập thất bại")
                      : "Đăng nhập thất bại"}
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="mt-2 w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link href="#" className="font-medium text-primary underline-offset-4 hover:underline">
                  Liên hệ quản trị viên
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
