import React from 'react';
import { NewsStatus } from '../../types';

export const Badge: React.FC<{ status: NewsStatus }> = ({ status }) => {
    const styles = {
        draft: "bg-slate-100 text-slate-700",
        pending_approval: "bg-amber-100 text-amber-800",
        published: "bg-emerald-100 text-emerald-800",
        rejected: "bg-red-100 text-red-800",
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>{status.replace('_', ' ')}</span>;
};
