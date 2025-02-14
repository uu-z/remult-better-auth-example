import { makeAutoObservable, runInAction } from 'mobx';
import { Repository, FindOptions, LiveQuery } from 'remult';
import { IBaseEntity, IListResult, IQueryOptions, LiveQueryCallback } from './types';
import { useEffect } from 'react';

export class ListStore<T extends IBaseEntity<T>> {
  private liveQueries: Map<string, LiveQuery<T> & { unsubscribe?: VoidFunction }> = new Map();
  private queryOptions: IQueryOptions<T> = {};

  state = {
    data: [] as T[],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false
  };

  constructor(private repository: Repository<T>) {
    makeAutoObservable(this);
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
    this.stopLiveQuery(queryKey);

    runInAction(() => {
      this.state.loading = true;
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

      liveQuery.subscribe(async changes => {
        runInAction(() => {
          this.state.data = changes.items;
          this.state.loading = false;
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
        Object.assign(this.state, result, { loading: false });
      });

      return result;
    } catch (error) {
      runInAction(() => {
        this.state.loading = false;
      });
      throw error;
    }
  }

  async list(options?: IQueryOptions<T>): Promise<IListResult<T>> {
    runInAction(() => {
      this.state.loading = true;
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
        Object.assign(this.state, result, { loading: false });
      });

      return result;
    } catch (error) {
      runInAction(() => {
        this.state.loading = false;
      });
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    runInAction(() => {
      this.state.loading = true;
    });

    try {
      const item = await this.repository.insert(data);

      runInAction(() => {
        this.state.total += 1;
        this.state.loading = false;
      });

      return item;
    } catch (error) {
      runInAction(() => {
        this.state.loading = false;
      });
      throw error;
    }
  }

  async update(id: T['id'], data: Partial<T>): Promise<T> {
    runInAction(() => {
      this.state.loading = true;
    });

    try {
      const item = await this.repository.update(id, data);

      runInAction(() => {
        this.state.data = this.state.data.map(d =>
          d.id === id ? item : d
        );
        this.state.loading = false;
      });

      return item;
    } catch (error) {
      runInAction(() => {
        this.state.loading = false;
      });
      throw error;
    }
  }

  async delete(id: T['id']): Promise<void> {
    runInAction(() => {
      this.state.loading = true;
    });

    try {
      await this.repository.delete(id);

      runInAction(() => {
        this.state.data = this.state.data.filter(d => d.id !== id);
        this.state.total -= 1;
        this.state.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.state.loading = false;
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

  useLive(options?: IQueryOptions<T>, callback?: LiveQueryCallback<T>) {
    const queryKey = this.getLiveQueryKey(options);

    useEffect(() => {
      this.liveList(options, callback);
      return () => this.stopLiveQuery(queryKey);
    }, [queryKey]);

    return {
      data: this.state.data,
      total: this.state.total,
      page: this.state.page,
      pageSize: this.state.pageSize,
      loading: this.state.loading,
    };
  }

  stopAllLiveQueries() {
    this.liveQueries.forEach(liveQuery => liveQuery.unsubscribe?.());
    this.liveQueries.clear();
  }
}
