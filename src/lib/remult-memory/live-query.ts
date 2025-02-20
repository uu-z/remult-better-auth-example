import { observable, reaction, runInAction } from "mobx";
import { useEffect, useState } from "react";

export function useLiveQuery<T>(query: () => Promise<T>): {
    data?: T;
    loading: boolean;
    error: any;
} {
    const [data, setData] = useState<T>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(true);

    useEffect(() => {
        const dispose = reaction(
            () => query,
            async (currentQuery) => {
                try {
                    const result = await currentQuery();
                    setData(result);
                    setLoading(false);
                } catch (err) {
                    setLoading(false);
                    setError(error);
                }
            },
            { fireImmediately: true }
        );

        return () => {
            dispose();
        };
    }, [query]);

    return { data, loading, error };
}

export function useAsyncQuery<T>(query: () => Promise<T>) {
    const [state, setState] = useState<{
        data?: T;
        loading: boolean;
        error?: any;
    }>({
        loading: true
    });

    useEffect(() => {
        let mounted = true;
        console.log(123)
        mounted && query().then(
            result => mounted && setState({ data: result, loading: false }),
            error => mounted && setState({ error, loading: false })
        );

        return () => { mounted = false };
    }, []);

    return state
}