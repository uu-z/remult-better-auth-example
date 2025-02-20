"use client";
import { makeAutoObservable, observable, runInAction } from 'mobx';
import {
    Repository,
    EntityMetadata,
    FindOptions,
    EntityFilter,
    FindFirstOptions,
    EntityOrderBy,
    QueryResult,
    ClassType,
    remult,
    LiveQuery,
    Remult,
} from 'remult';
import { ObjectPool, WeakWrap } from '../utils';
import { useAsyncQuery, useLiveQuery } from './live-query';



class MemoryDB {
    private store = new Map<string, any[]>();
    private idCounter = new Map<string, number>();

    constructor() {
        makeAutoObservable(this, {
            store: observable
        });
    }

    getCollection<T>(entityKey: string): T[] {
        if (!this.store.has(entityKey)) {
            this.store.set(entityKey, []);
            this.idCounter.set(entityKey, 0);
        }
        return this.store.get(entityKey) as T[];
    }

    private getNextId(entityKey: string): string {
        const current = this.idCounter.get(entityKey) || 0;
        this.idCounter.set(entityKey, current + 1);
        return (current + 1).toString();
    }

    private applyFilter<T>(items: T[], where: EntityFilter<T>): T[] {
        if (!where) return items;
        return items.filter(item => {
            return Object.entries(where).every(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    // Handle special operators like $contains, $gt, etc
                    const [operator, operand] = Object.entries(value)[0];
                    switch (operator) {
                        case '$contains':
                            return String(item[key]).includes(String(operand));
                        case '$gt':
                            return item[key] > operand;
                        case '$gte':
                            return item[key] >= operand;
                        case '$lt':
                            return item[key] < operand;
                        case '$lte':
                            return item[key] <= operand;
                        case '$ne':
                            return item[key] !== operand;
                    }
                }
                return item[key] === value;
            });
        });
    }

    private applySort<T>(items: T[], orderBy: EntityOrderBy<T>): T[] {
        if (!orderBy) return items;

        const sortedItems = [...items];
        sortedItems.sort((a, b) => {
            for (const [key, direction] of Object.entries(orderBy)) {
                if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
                if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortedItems;
    }

    private applyPagination<T>(items: T[], limit?: number, page?: number): T[] {
        if (!limit) return items;
        const start = page ? (page - 1) * limit : 0;
        return items.slice(start, start + limit);
    }

    async insert<T>(entityKey: string, item: T): Promise<T> {
        const collection = this.getCollection<T>(entityKey);
        const newItem = {
            ...item,
            id: this.getNextId(entityKey)
        };

        runInAction(() => {
            collection.push(newItem);
        });
        return newItem;
    }

    async find<T>(entityKey: string, options: FindOptions<T> = {}): Promise<T[]> {
        let collection = this.getCollection<T>(entityKey);

        if (options.where) {
            collection = this.applyFilter(collection, options.where);
        }

        if (options.orderBy) {
            collection = this.applySort(collection, options.orderBy);
        }

        return this.applyPagination(collection, options.limit, options.page);
    }

    async findFirst<T>(entityKey: string, options: FindFirstOptions<T> = {}): Promise<T | undefined> {
        const results = await this.find(entityKey, { ...options, limit: 1 });
        return results[0];
    }

    async count<T>(entityKey: string, where?: EntityFilter<T>): Promise<number> {
        const collection = this.getCollection<T>(entityKey);
        if (where) {
            return this.applyFilter(collection, where).length;
        }
        return collection.length;
    }

    async update<T>(entityKey: string, id: string, item: Partial<T>): Promise<T> {
        const collection = this.getCollection<T>(entityKey);
        let updated: T;

        runInAction(() => {
            const index = collection.findIndex(item => (item as any).id === id);
            if (index === -1) throw new Error('Item not found');

            collection[index] = {
                ...collection[index],
                ...item
            };
            updated = collection[index];
        });

        return updated!;
    }

    async delete<T>(entityKey: string, id: string): Promise<void> {
        const collection = this.getCollection<T>(entityKey);

        runInAction(() => {
            const index = collection.findIndex(item => (item as any).id === id);
            if (index === -1) throw new Error('Item not found');
            collection.splice(index, 1);
        });
    }
}

class RemultRepo<T> implements Repository<T> {
    constructor(
        private entityKey: string,
        private db: MemoryDB,
        private metadata: EntityMetadata<T>
    ) { }

    async find(options?: FindOptions<T>): Promise<T[]> {
        return this.db.find(this.entityKey, options);
    }

    liveQuery(options?: FindOptions<T>) {
        return useLiveQuery(() => this.find(options))
    }

    async findFirst(options?: FindFirstOptions<T>): Promise<T | undefined> {
        return this.db.findFirst(this.entityKey, options);
    }

    async insert(item: Partial<T>): Promise<T> {
        return this.db.insert(this.entityKey, item);
    }

    async update(id: any, item: Partial<T>): Promise<T> {
        return this.db.update(this.entityKey, id, item);
    }

    async save(item: Partial<T>): Promise<T> {
        return this.db.update(this.entityKey, item.id, item);
    }

    async delete(id: any): Promise<void> {
        return this.db.delete(this.entityKey, id);
    }

    async count(where?: EntityFilter<T>): Promise<number> {
        return this.db.count(this.entityKey, where);
    }

    async query(options?: FindOptions<T>): Promise<QueryResult<T>> {
        const items = await this.find(options);
        const count = await this.count(options?.where);

        return {
            items,
            count,
            page: options?.page || 1,
            pageSize: options?.limit || items.length
        };
    }

    metadata() {
        return this.metadata;
    }

    // fields = this.metadata.fields;
    // relations = this.metadata.relations;
}

// const remultContext = new Remult();
const db = new MemoryDB();

export function memoryAdapter(): Remult {
    return {
        //@ts-ignore
        adapter: "memory",
        ...remult,
        repo: <T>(entity: ClassType<T>) => {
            // const repository = remultContext.repo(entity);
            const key = entity.name.toLowerCase();
            return ObjectPool.get(key, () => new RemultRepo<T>(key, db, {}))
        },
    }
}
export function httpAdapter(): Remult {
    //@ts-ignore
    return { adapter: "http", ...remult }
}

type QueryResult<T> = {
    data: T
    loading: boolean
    error: any
}

type WrapWithQueryResult<T> = T extends Promise<infer R> ? QueryResult<R> : never

type RepositoryMethodsOnly<T> = {
    [K in keyof Repository<T>]: Repository<T>[K] extends (...args: any[]) => any
    ? (...args: Parameters<Repository<T>[K]>) => WrapWithQueryResult<ReturnType<Repository<T>[K]>>
    : never
}

export function liveProxy(args: { adapter: Remult & { adapter?: string } }) {
    return {
        repo: <T>(entity: ClassType<T>): RepositoryMethodsOnly<T> => {
            const repo = args.adapter.repo(entity)

            if (args.adapter.adapter == "memory") {
                //@ts-ignore
                return new Proxy(repo, {
                    get(target, prop: keyof Repository<T>) {
                        //@ts-ignore
                        return (...args: any[]) => useLiveQuery(() => target[prop](...args))
                    }
                }) as RepositoryMethodsOnly<T>
            }
            if (args.adapter.adapter == "http") {
                //@ts-ignore
                return new Proxy(repo, {
                    get(target, prop: keyof Repository<T>) {
                        //@ts-ignore
                        return (...args: any[]) => useAsyncQuery(() => target[prop](...args))
                    }
                }) as RepositoryMethodsOnly<T>
            }
            throw new Error("not support adapter")
        }
    }
}