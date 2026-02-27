import { useEffect } from 'react';

/**
 * Shows a browser "leave page?" dialog when `isDirty` is true.
 * Works with both browser navigation and React Router v6 transitions.
 */
export function useUnsavedChanges(isDirty: boolean) {
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);
}
