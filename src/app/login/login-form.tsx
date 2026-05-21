"use client";

import { FormEvent, useReducer } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Warehouse } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  canAccessPath,
  getDefaultPathForRoles,
  getUserRoles,
} from "@/lib/access-control";
import { clearExplicitLogout, saveToken } from "@/lib/auth-token";
import { useAppDispatch } from "@/store/hooks";
import { baseApi } from "@/store/services/api";
import { useLoginMutation } from "@/store/services/auth.service";

const REMEMBER_ACCOUNT_KEY = "warehouse-login-account";
const REMEMBER_LOGIN_MODE_KEY = "warehouse-login-mode";

type LoginFormState = {
  username: string;
  password: string;
  showPassword: boolean;
  isEmail: boolean;
  rememberAccount: boolean;
};

function readRememberedAccount() {
  if (typeof window === "undefined") {
    return { account: "", isEmail: false, remembered: false };
  }

  try {
    const account = window.localStorage.getItem(REMEMBER_ACCOUNT_KEY) ?? "";
    const mode = window.localStorage.getItem(REMEMBER_LOGIN_MODE_KEY);

    return {
      account,
      isEmail: mode === "email",
      remembered: account.length > 0,
    };
  } catch {
    return { account: "", isEmail: false, remembered: false };
  }
}

function createInitialState(): LoginFormState {
  const rememberedAccount = readRememberedAccount();

  return {
    username: rememberedAccount.account,
    password: "",
    showPassword: false,
    isEmail: rememberedAccount.isEmail,
    rememberAccount: rememberedAccount.remembered,
  };
}

function saveRememberedAccount(account: string, isEmail: boolean) {
  if (typeof window === "undefined") return;

  const value = account.trim();
  if (!value) return;

  window.localStorage.setItem(REMEMBER_ACCOUNT_KEY, value);
  window.localStorage.setItem(
    REMEMBER_LOGIN_MODE_KEY,
    isEmail ? "email" : "username",
  );
}

function clearRememberedAccount() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(REMEMBER_ACCOUNT_KEY);
  window.localStorage.removeItem(REMEMBER_LOGIN_MODE_KEY);
}

function safeCallbackUrl(value: string | null, fallbackUrl: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return fallbackUrl;
  }

  return value;
}

function getCallbackUrl(fallbackUrl: string) {
  if (typeof window === "undefined") return fallbackUrl;

  return safeCallbackUrl(
    new URLSearchParams(window.location.search).get("callbackUrl"),
    fallbackUrl,
  );
}

function loginFormReducer(state: LoginFormState, patch: Partial<LoginFormState>) {
  return { ...state, ...patch };
}

export function LoginForm() {
  const { replace } = useRouter();
  const dispatch = useAppDispatch();
  const [form, updateForm] = useReducer(loginFormReducer, undefined, createInitialState);
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const credentials = form.isEmail
        ? { email: form.username, password: form.password }
        : { username: form.username, password: form.password };
      const result = await login(credentials).unwrap();
      clearExplicitLogout();
      const token = saveToken(result.accessToken);

      if (!token) {
        throw new Error("Login response missing accessToken");
      }

      if (form.rememberAccount) {
        saveRememberedAccount(form.username, form.isEmail);
      } else {
        clearRememberedAccount();
      }

      dispatch(baseApi.util.resetApiState());
      const userRoles = getUserRoles(result.user?.roles);
      const defaultPath = getDefaultPathForRoles(userRoles) ?? "/dashboard";
      const callbackUrl = getCallbackUrl(defaultPath);
      replace(canAccessPath(callbackUrl, userRoles) ? callbackUrl : defaultPath);
    } catch {
      // Error handled by redux state.
    }
  };

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted/45 px-4 py-10">
      <section className="w-full max-w-md">
        <Card className="rounded-2xl border-border bg-card shadow-xl sm:px-6">
          <CardHeader className="space-y-4 px-0 pb-4">
            <div className="flex flex-col items-center">
              <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Warehouse className="size-8" />
              </div>
              <div className="text-center">
                <CardTitle className="text-3xl font-semibold tracking-tight text-primary">
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
                  <Label htmlFor="username" className="text-sm font-medium text-foreground">
                    {form.isEmail ? "Email" : "Tên đăng nhập"}
                  </Label>
                  <button
                    type="button"
                    onClick={() => updateForm({ isEmail: !form.isEmail })}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {form.isEmail ? "Dùng tên đăng nhập" : "Dùng email"}
                  </button>
                </div>
                <Input
                  id="username"
                  name={form.isEmail ? "email" : "username"}
                  type={form.isEmail ? "email" : "text"}
                  placeholder={form.isEmail ? "nguoidung@congty.vn" : "ma.nhanvien"}
                  autoComplete={form.isEmail ? "email" : "username"}
                  value={form.username}
                  onChange={(event) => updateForm({ username: event.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Mật khẩu
                  </Label>
                  <Link
                    href="mailto:admin@stockmaster.local?subject=Yeu%20cau%20dat%20lai%20mat%20khau%20StockMaster"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={form.showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => updateForm({ password: event.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10 focus:border-primary focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm({ showPassword: !form.showPassword })}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {form.showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              <label
                htmlFor="remember-account"
                className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
              >
                <Checkbox
                  id="remember-account"
                  checked={form.rememberAccount}
                  onCheckedChange={(checked) => {
                    const enabled = checked === true;
                    updateForm({ rememberAccount: enabled });
                    if (!enabled) {
                      clearRememberedAccount();
                    }
                  }}
                  disabled={isLoading}
                />
                <span>Ghi nhớ tài khoản trên thiết bị này</span>
              </label>

              {error ? (
                <div className="rounded-lg border border-destructive/20 bg-danger-soft p-3 text-sm text-destructive">
                  {typeof error === "object" && "data" in error
                    ? ((error.data as { message?: string })?.message || "Đăng nhập thất bại")
                    : "Đăng nhập thất bại"}
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="mt-2 h-11 w-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang xử lý…
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                href="mailto:admin@stockmaster.local?subject=Yeu%20cau%20cap%20tai%20khoan%20StockMaster"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Liên hệ quản trị viên
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© 2026 StockMaster WMS. Bảo lưu mọi quyền.</p>
        </div>
      </section>
    </main>
  );
}
