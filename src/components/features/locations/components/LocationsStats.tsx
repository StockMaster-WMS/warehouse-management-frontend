type LocationsStatsProps = {
    totalLocations: number;
    activeLocations: number;
    inactiveLocations: number;
    filteredCount: number;
};

export function LocationsStats({
    totalLocations,
    activeLocations,
    inactiveLocations,
    filteredCount,
}: LocationsStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tổng vị trí</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalLocations}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Đang dùng
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-200">{activeLocations}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                    Ngừng dùng
                </p>
                <p className="mt-2 text-2xl font-black text-rose-800 dark:text-rose-200">{inactiveLocations}</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                    Kết quả lọc
                </p>
                <p className="mt-2 text-2xl font-black text-indigo-800 dark:text-indigo-200">{filteredCount}</p>
            </div>
        </div>
    );
}
