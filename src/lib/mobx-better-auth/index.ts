import { makeAutoObservable, runInAction } from 'mobx'
import { ObjectPool, WeakWrap } from '../utils'
import { useEffect } from 'react'

export interface RequestState<T> {
    data: T extends { data: infer D } ? D : T | null;
    loading: boolean;
    error: Error | null;
}

type AsyncMethod<T> = T extends (...args: infer P) => Promise<infer R> ? {
    call: (...args: P) => Promise<R>;
    use: (...args: P) => RequestState<R>;
} : never;

type ProxifiedObject<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => Promise<any>
    ? AsyncMethod<T[K]>
    : T[K] extends object
    ? ProxifiedObject<T[K]>
    : T[K];
}

class RequestStore<T extends (...args: any[]) => Promise<any>> {
    data: Awaited<ReturnType<T>> | null = null;
    loading = false;
    error: Error | null = null;
    fn: T;
    authClient: any;

    constructor(args: Partial<RequestStore<T>>) {
        Object.assign(this, args)
        makeAutoObservable(this);
    }

    async execute(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
        this.loading = true;
        this.error = null;

        try {
            const result = await this.fn(...args);
            runInAction(() => {
                this.data = result.data
            });
            return result;
        } catch (err) {
            runInAction(() => {
                this.error = err as Error;
            });
            throw err;
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    use(...args: Parameters<T>): RequestState<Awaited<ReturnType<T>>> {
        const session = this.authClient.useSession();

        useEffect(() => {
            this.execute(...args);
        }, [session]);

        return {
            data: this.data,
            loading: this.loading,
            error: this.error
        };
    }
}

export function BetterAuthProxy<T extends object>(sdk: T): ProxifiedObject<T> {
    return new Proxy(sdk, {
        get(t1: any, p1: string) {
            if (typeof t1[p1] === 'function') {
                const fn = t1[p1]
                return new Proxy(t1[p1], {
                    get: function (t2: any, p2: string) {
                        if (['use', 'call'].includes(p2)) {
                            const store = ObjectPool.get(`${p1}.${p2}`, () => new RequestStore({ fn, authClient: sdk }))
                            return (...args: any[]) => store.use(...args)
                        }
                        const fn2 = t2[p2]
                        const store = ObjectPool.get(`${p1}.${p2}`, () => new RequestStore({ fn: fn2, authClient: sdk }))
                        return {
                            call: (...args: any[]) => store.execute(...args),
                            use: (...args: any[]) => store.use(...args)
                        }
                    },
                })
            }
            return t1[p1]
        }
    }) as ProxifiedObject<T>
}
