"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, CalendarClock, ChevronRight, Copy, Edit2, Package, Ruler, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Product } from "@/types/product";
import type { Location } from "@/types/location";
import type { Stock } from "@/types/stock";
import { getProductCategoryDisplayName } from "@/lib/product-display";

export function formatLocationCode(location?: Location) {
  if (!location) return "--";
  if (location.code?.trim()) return location.code.trim();
  const pieces = [
    location.zone,
    location.aisle,
    location.rack,
    location.level != null ? String(location.level) : "",
    location.bin,
  ].flatMap((value) => {
    const normalized = typeof value === "string" ? value.trim() : value;
    return normalized ? [normalized] : [];
  });
  return pieces.length ? pieces.join("-") : "--";
}

function getLocationParts(location?: Location, fallbackLocationId?: string) {
  const parseFromCode = (code?: string | null) => {
    const normalized = code?.trim();
    if (!normalized) return null;
    const chunks = normalized
      .split(/[-_/\.\s]+/)
      .flatMap((value) => {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
      });
    if (chunks.length < 3) return null;
    return {
      zone: chunks[0],
      rack: chunks[1],
      aisle: chunks[2],
      level: undefined as string | undefined,
      bin: chunks[3],
    };
  };

  if (!location) {
    return {
      zone: "",
      rack: "",
      aisle: "",
      level: "",
      bin: "",
      fallback: fallbackLocationId
        ? `Mã vị trí: ...${fallbackLocationId.slice(-6).toUpperCase()}`
        : "Chưa có thông tin vị trí",
    };
  }

  const direct = {
    zone: location.zone?.trim() || "",
    rack: location.rack?.trim() || "",
    aisle: location.aisle?.trim() || "",
    level:
      location.level != null && String(location.level).trim()
        ? String(location.level).trim()
        : "",
    bin: location.bin?.trim() || "",
  };

  if (direct.zone || direct.rack || direct.aisle || direct.level || direct.bin) {
    return { ...direct, fallback: "" };
  }

  const parsed = parseFromCode(location.code);
  if (parsed) return { ...parsed, fallback: "" };

  return {
    zone: "",
    rack: "",
    aisle: "",
    level: "",
    bin: "",
    fallback: location.id
      ? `Mã vị trí: ...${location.id.slice(-6).toUpperCase()}`
      : "Chưa có thông tin vị trí",
  };
}

export function ProductHero({ product, onCopySku }: { product: Product; onCopySku: () => void }) {
  const initials = (product.name || product.sku || "?").trim().slice(0, 2).toUpperCase();
  const category = getProductCategoryDisplayName(product);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50/40 to-indigo-50/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25 sm:h-16 sm:w-16 sm:text-base"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Link
                href="/products"
                className="text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sản phẩm
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              <span className="truncate text-slate-600 dark:text-slate-300">Chi tiết</span>
            </nav>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              <span className="wrap-break-word">{product.name}</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Mã hàng
                </span>
                <span className="font-mono">{product.sku}</span>
                <button
                  type="button"
                  onClick={onCopySku}
                  className="ml-0.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                  title="Sao chép mã hàng"
                  aria-label="Sao chép mã hàng"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </span>
              <StatusBadge status={product.status} />
              {product.baseUnit ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  ĐVT: {product.baseUnit}
                </span>
              ) : null}
              {category ? (
                <span className="max-w-full truncate rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                  {category}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button
            render={<Link href={`/products/${product.id}/edit`} />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm sm:min-w-35"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            render={<Link href="/products" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900 sm:min-w-35"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Danh sách
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: Product["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? "Hoạt động" : "Ngưng"}
    </span>
  );
}

export function InfoField({
  label,
  value,
  mono = false,
  compact = false,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-slate-50/70 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-900/55 ${compact ? "text-center" : ""} ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 wrap-break-word text-sm font-semibold text-slate-800 dark:text-slate-100 ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export function StockByLocationList({
  stocks,
  locationMap,
  isLoading,
  errorMessage,
}: {
  stocks: Stock[];
  locationMap: Record<string, Location>;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`stock-location-loading-${i}`} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
        {errorMessage}
      </p>
    );
  }

  if (stocks.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
        Chưa có tồn kho theo vị trí cho sản phẩm này.
      </p>
    );
  }

  const sortedStocks = stocks.toSorted((a, b) => {
    const availableDiff = Number(b.qtyAvailable || 0) - Number(a.qtyAvailable || 0);
    if (availableDiff !== 0) return availableDiff;
    return Number(b.qtyOnHand || 0) - Number(a.qtyOnHand || 0);
  });

  return (
    <div className="space-y-3">
      {sortedStocks.map((stock) => {
        const location = locationMap[stock.locationId];
        const parts = getLocationParts(location, stock.locationId);

        return (
          <div
            key={stock.id}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Boxes className="h-4 w-4 text-indigo-600" />
                  <span className="truncate">
                    {location?.code || formatLocationCode(location)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {parts.fallback || formatLocationCode(location)}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {Number(stock.qtyAvailable || 0)} khả dụng
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <InfoField label="On hand" value={String(stock.qtyOnHand ?? 0)} mono compact />
              <InfoField label="Available" value={String(stock.qtyAvailable ?? 0)} mono compact />
              <InfoField label="Đang giữ chỗ" value={String(stock.qtyReserved ?? 0)} mono compact />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 dark:bg-slate-800/70">
                <Ruler className="h-3.5 w-3.5" />
                {parts.zone || "--"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 dark:bg-slate-800/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                {parts.aisle || "--"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 dark:bg-slate-800/70">
                <CalendarClock className="h-3.5 w-3.5" />
                {parts.rack || "--"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
