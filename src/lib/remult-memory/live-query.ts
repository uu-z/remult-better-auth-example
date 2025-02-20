import { useEffect, useState } from 'react';

export function useLiveQuery<T>(
    query: () => Promise<T>
): { data?: T; loading: boolean } {
    const [data, setData] = useState<T>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let disposed = false;

        async function load() {
            try {
                const result = await query();
                if (!disposed) {
                    setData(result);
                    setLoading(false);
                }
                return result;
            } catch (err) {
                if (!disposed) {
                    setLoading(false);
                }
                throw err;
            }
        }

        // Initial load
        load();

        return () => {
            disposed = true;
        };
    }, [query]);

    return { data, loading };
}

