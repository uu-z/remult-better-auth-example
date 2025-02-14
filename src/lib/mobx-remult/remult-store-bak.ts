// store.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { FormEvent, useEffect } from 'react';
import { type Repository, remult, type FindOptions, type EntityFilter, type LiveQueryChange, type LiveQuery, Unsubscribe } from 'remult';
import { idType } from 'remult/src/remult3/remult3';

export interface IBaseEntity<T> {
    id: idType<T>;
    [key: string]: any;
}

export interface IPagination {
    page?: number;
    pageSize?: number;
}

export interface IQueryOptions<T> extends Partial<FindOptions<T>>, IPagination { }

export type LiveQueryCallback<T> = (change: LiveQueryChange) => void;

export interface IListResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface EntityType<T> {
    new(...args: any[]): T;
}



export class RemultStore<T extends IBaseEntity<T>> {
    private static instances = new Map<EntityType<any>, RemultStore<any>>();
    private liveQueries: Map<string, LiveQuery<T> & { unsubscribe?: VoidFunction }> = new Map();


    state = {
        list: {
            data: [] as T[],
            total: 0,
            page: 1,
            pageSize: 10,
            loading: false
        },
        form: {
            data: null as Partial<T> | null,
            errors: {} as Record<keyof T, string[]>,
            loading: false,
            saving: false
        },
        detail: {
            data: null as T | null,
            loading: false
        }
    };

    private queryOptions: IQueryOptions<T> = {};

    private constructor(private repository: Repository<T>, private entityType: EntityType<T>) {
        makeAutoObservable(this);
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) {
                    //@ts-ignore
                    return target[prop];
                }
                //@ts-ignore
                return repository[prop];
            }
        });
    }


    get metadata() {
        return this.repository.metadata
    }


    private getLiveQueryKey(options?: IQueryOptions<T>): string {
        return JSON.stringify(options || {});
    }

    private stopLiveQuery(key: string) {
        const liveQuery = this.liveQueries.get(key);
        if (liveQuery) {
            liveQuery.unsubscribe?.();
            this.liveQueries.delete(key);
        }
    }

    async liveList(
        options?: IQueryOptions<T>,
        callback?: LiveQueryCallback<T>
    ): Promise<IListResult<T>> {
        const queryKey = this.getLiveQueryKey(options);

        // 停止之前的LiveQuery
        this.stopLiveQuery(queryKey);

        runInAction(() => {
            this.state.list.loading = true;
        });

        try {
            const { page = 1, pageSize = 10, ...rest } = options || {};

            const mergedOptions = {
                ...this.queryOptions,
                ...rest,
                limit: pageSize,
                page
            };

            const liveQuery = this.repository.liveQuery(mergedOptions);

            this.liveQueries.set(queryKey, liveQuery);

            //@ts-ignore
            liveQuery.subscribe = liveQuery.subscribe(async changes => {
                // const total = await this.repository.count(mergedOptions.where || {});

                runInAction(() => {
                    this.state.list.data = changes.items;
                    // this.state.list.total = total;
                    this.state.list.loading = false;
                });

                //@ts-ignore
                callback?.(changes);
            });

            const [items, total] = await Promise.all([
                this.repository.find(mergedOptions),
                this.repository.count(mergedOptions.where || {})
            ]);

            const result = {
                data: items,
                total,
                page,
                pageSize
            };

            runInAction(() => {
                Object.assign(this.state.list, result, { loading: false });
            });

            return result;
        } catch (error) {
            runInAction(() => {
                this.state.list.loading = false;
            });
            throw error;
        }
    }

    async liveGet(
        id: string | number,
        callback?: LiveQueryCallback<T>
    ): Promise<T | null> {
        const queryKey = `detail_${id}`;

        this.stopLiveQuery(queryKey);

        runInAction(() => {
            this.state.detail.loading = true;
        });

        try {
            const options: any = { where: { id } };

            const liveQuery = this.repository.liveQuery(options);

            this.liveQueries.set(queryKey, liveQuery);

            liveQuery.subscribe(changes => {
                runInAction(() => {
                    this.state.detail.data = changes.items[0] || null;
                    this.state.detail.loading = false;
                });

                //@ts-ignore
                callback?.(changes);
            });

            const item = await this.repository.findFirst(options as any);

            runInAction(() => {
                this.state.detail.data = item;
                this.state.detail.loading = false;
            });

            return item;
        } catch (error) {
            runInAction(() => {
                this.state.detail.loading = false;
            });
            throw error;
        }
    }

    useLiveList(options?: IQueryOptions<T>, callback?: LiveQueryCallback<T>) {
        const store = this;
        const queryKey = this.getLiveQueryKey(options);

        useEffect(() => {
            store.liveList(options, callback);
            return () => store.stopLiveQuery(queryKey);
        }, [queryKey]);

        return {
            data: store.state.list.data,
            total: store.state.list.total,
            page: store.state.list.page,
            pageSize: store.state.list.pageSize,
            loading: store.state.list.loading,
        };

    }


    useLiveDetail(id: string | number, callback?: LiveQueryCallback<T>) {
        const store = this;
        const queryKey = `detail_${id}`;

        useEffect(() => {
            this.liveGet(id, callback);
            return () => store.stopLiveQuery(queryKey);
        }, [id]);

        return {
            data: store.state.detail.data,
            loading: store.state.detail.loading,
        };
    }

    static Get<T extends IBaseEntity<T>>(entityType: EntityType<T>): RemultStore<T> {
        if (!this.instances.has(entityType)) {
            const repo = remult.repo(entityType);
            this.instances.set(
                entityType,
                new RemultStore<T>(repo, entityType)
            );
        }
        return this.instances.get(entityType)!;
    }

    async list(options?: IQueryOptions<T>): Promise<IListResult<T>> {
        runInAction(() => {
            this.state.list.loading = true;
        });

        try {
            const { page = 1, pageSize = 10, ...rest } = options || {};

            const mergedOptions = {
                ...this.queryOptions,
                ...rest,
                limit: pageSize,
                page
            };

            const [items, total] = await Promise.all([
                this.repository.find(mergedOptions),
                this.repository.count(mergedOptions.where || {})
            ]);

            const result = {
                data: items,
                total,
                page,
                pageSize
            };

            runInAction(() => {
                Object.assign(this.state.list, result, { loading: false });
            });

            return result;
        } catch (error) {
            runInAction(() => {
                this.state.list.loading = false;
            });
            throw error;
        }
    }

    async get(where: EntityFilter<T>): Promise<T | null> {
        runInAction(() => {
            this.state.detail.loading = true;
        });

        try {
            const item = await this.repository.findFirst(where);

            runInAction(() => {
                this.state.detail.data = item;
                this.state.detail.loading = false;
            });

            return item;
        } catch (error) {
            runInAction(() => {
                this.state.detail.loading = false;
            });
            throw error;
        }
    }

    async create(data: Partial<T>): Promise<T> {
        runInAction(() => {
            this.state.list.loading = true;
        });

        try {
            const item = await this.repository.insert(data);

            runInAction(() => {
                // this.state.list.data = Array.from(new Set([...this.state.list.data, item]));
                this.state.list.total += 1;
                this.state.list.loading = false;
            });

            return item;
        } catch (error) {
            runInAction(() => {
                this.state.list.loading = false;
            });
            throw error;
        }
    }

    // 更新
    async update(id: idType<T>, data: Partial<T>): Promise<T> {
        runInAction(() => {
            this.state.list.loading = true;
        });

        try {
            const item = await this.repository.update(id, data);

            runInAction(() => {
                this.state.list.data = this.state.list.data.map(d =>
                    d.id === id ? item : d
                );
                if (this.state.detail.data?.id === id) {
                    this.state.detail.data = item;
                }
                this.state.list.loading = false;
            });

            return item;
        } catch (error) {
            runInAction(() => {
                this.state.list.loading = false;
            });
            throw error;
        }
    }

    async delete(id: idType<T>): Promise<void> {
        runInAction(() => {
            this.state.list.loading = true;
        });

        try {
            await this.repository.delete(id);

            runInAction(() => {
                this.state.list.data = this.state.list.data.filter(d => d.id !== id);
                this.state.list.total -= 1;
                if (this.state.detail.data?.id === id) {
                    this.state.detail.data = null;
                }
                this.state.list.loading = false;
            });
        } catch (error) {
            runInAction(() => {
                this.state.list.loading = false;
            });
            throw error;
        }
    }

    async setPage(page: number): Promise<IListResult<T>> {
        return this.list({ ...this.queryOptions, page });
    }

    async setPageSize(pageSize: number): Promise<IListResult<T>> {
        return this.list({ ...this.queryOptions, pageSize, page: 1 });
    }

    async sort(orderBy: FindOptions<T>['orderBy']): Promise<IListResult<T>> {
        this.queryOptions.orderBy = orderBy;
        return this.list(this.queryOptions);
    }

    async filter(where: FindOptions<T>['where']): Promise<IListResult<T>> {
        this.queryOptions.where = where;
        return this.list({ ...this.queryOptions, page: 1 });
    }

    async reset(): Promise<IListResult<T>> {
        this.queryOptions = {};
        return this.list({ page: 1, pageSize: 10 });
    }



    stopAllLiveQueries() {
        this.liveQueries.forEach(liveQuery => liveQuery.unsubscribe?.());
        this.liveQueries.clear();
    }

    // Form Methods
    initForm(initialValues?: Partial<T>) {
        runInAction(() => {
            this.state.form.data = initialValues || null;
            this.state.form.errors = {} as Record<keyof T, string[]>;
            this.state.form.loading = false;
            this.state.form.saving = false;
        });
    }

    setFormField<K extends keyof T>(field: K, value: T[K]) {
        runInAction(() => {
            if (!this.state.form.data) {
                this.state.form.data = {} as Partial<T>;
            }
            this.state.form.data[field] = value;
            // Clear error when field is modified
            if (this.state.form.errors[field]) {
                delete this.state.form.errors[field];
            }
        });
    }

    setFormFields(fields: Partial<T>) {
        runInAction(() => {
            this.state.form.data = {
                ...this.state.form.data,
                ...fields
            };
            // Clear errors for updated fields
            Object.keys(fields).forEach(key => {
                if (this.state.form.errors[key as keyof T]) {
                    delete this.state.form.errors[key as keyof T];
                }
            });
        });
    }

    setFormErrors(errors: Record<keyof T, string[]>) {
        runInAction(() => {
            this.state.form.errors = errors;
        });
    }

    resetForm() {
        runInAction(() => {
            this.state.form.data = null;
            this.state.form.errors = {} as Record<keyof T, string[]>;
            this.state.form.loading = false;
            this.state.form.saving = false;
        });
    }

    async handleSubmit(e?: FormEvent) {
        e?.preventDefault();

        if (!this.state.form.data) {
            return;
        }

        runInAction(() => {
            this.state.form.saving = true;
        });

        try {
            let result: T;
            if (this.state.form.data.id) {
                result = await this.update(this.state.form.data.id, this.state.form.data);
            } else {
                result = await this.create(this.state.form.data);
            }

            runInAction(() => {
                this.state.form.saving = false;
                this.resetForm();
            });

            return result;
        } catch (error) {
            runInAction(() => {
                this.state.form.saving = false;
                if (error instanceof Error) {
                    // Handle validation errors if they come as error.errors
                    const validationErrors = (error as any).errors;
                    if (validationErrors) {
                        this.setFormErrors(validationErrors);
                    }
                }
            });
            throw error;
        }
    }

    setFormFromEntity(entity: T) {
        this.initForm(entity);
    }

    useForm() {
        return {
            data: this.state.form.data,
            errors: this.state.form.errors,
            loading: this.state.form.loading,
            saving: this.state.form.saving,
            setField: this.setFormField.bind(this),
            setFields: this.setFormFields.bind(this),
            reset: this.resetForm.bind(this),
            submit: this.handleSubmit.bind(this),
            setFromEntity: this.setFormFromEntity.bind(this)
        };
    }
}
