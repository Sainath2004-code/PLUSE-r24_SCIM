import { useEffect, useRef, useState } from 'react';

type SaveFn = () => Promise<void>;

/**
 * Automatically calls `saveFn` every `intervalMs` ms.
 * Returns { lastSaved, saving } for UI display.
 */
export function useAutoSave(saveFn: SaveFn, intervalMs = 30_000) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saving, setSaving] = useState(false);
    const fnRef = useRef(saveFn);

    // Keep ref in sync so interval always calls latest version
    useEffect(() => { fnRef.current = saveFn; }, [saveFn]);

    useEffect(() => {
        const id = setInterval(async () => {
            setSaving(true);
            try {
                await fnRef.current();
                setLastSaved(new Date());
            } catch (e) {
                console.warn('Auto-save failed:', e);
            } finally {
                setSaving(false);
            }
        }, intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);

    return { lastSaved, saving };
}
