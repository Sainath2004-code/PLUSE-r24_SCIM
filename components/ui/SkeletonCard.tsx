import React from 'react';

/** Shimmer skeleton for a table row */
export const SkeletonRow: React.FC = () => (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-700">
        <td className="px-4 py-3"><div className="w-12 h-9 bg-slate-200 dark:bg-slate-700 rounded" /></td>
        <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" /></td>
        <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" /></td>
        <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>
        <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" /></td>
        <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto" /></td>
    </tr>
);

/** Shimmer skeleton for a stat card */
export const SkeletonStatCard: React.FC = () => (
    <div className="animate-pulse bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
);

/** Shimmer for a news/media grid card */
export const SkeletonMediaCard: React.FC = () => (
    <div className="animate-pulse rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="h-32 bg-slate-200 dark:bg-slate-700" />
        <div className="p-3 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
    </div>
);
