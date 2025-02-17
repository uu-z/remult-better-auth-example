import { makeAutoObservable, runInAction } from 'mobx'
import { ObjectPool, WeakWrap } from '../utils'
import { useEffect } from 'react'

export type AsyncFunction<P extends any[] = any[], R = any> = (...args: P) => Promise<R>;

export interface RequestState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

export type AsyncMethodResult<T extends AsyncFunction> = {
    call: T;
    use: (...args: Parameters<T>) => RequestState<Awaited<ReturnType<T>>>;
}

type IsFunction<T> = T extends (...args: any[]) => any ? T : never;
type IsObject<T> = T extends object ? T : never;

export type ProxifiedObject<T> = {
    [K in keyof T]: T[K] extends IsFunction<T[K]>
    ? AsyncMethodResult<T[K]>
    : T[K] extends IsObject<T[K]>
    ? ProxifiedObject<T[K]>
    : T[K];
}



class RequestStore<T extends AsyncFunction> {
    data: Awaited<ReturnType<T>> = {};
    loading = false;
    error: Error | null = null;
    fn: T
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
                console.log(this.data)
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

    hooks = {
        //@ts-ignore
        call: (...args: any[]) => this.execute(...args),
        //@ts-ignore
        use: (...args: any[]) => this.use(...args)
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
                            const store = ObjectPool.get(`$${p1}.${p2}`, () => new RequestStore({ fn, authClient: sdk }))
                            //@ts-ignore
                            return (...args: any[]) => store.use(...args)
                        }
                        const fn2 = t2[p2]
                        const store = ObjectPool.get(`$${p1}.${p2}`, () => new RequestStore({ fn: fn2, authClient: sdk }))
                        return {
                            //@ts-ignore
                            call: (...args: any[]) => store.execute(...args),
                            //@ts-ignore
                            use: (...args: any[]) => store.use(...args)
                        }
                    },
                })
            }

            if (typeof t1[p1] === 'object' && t1[p1] !== null) {
                return BetterAuthProxy(t1[p1])
            }

            return t1[p1]
        }
    })
}
