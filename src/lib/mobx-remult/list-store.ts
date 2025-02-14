import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Repository, FindOptions, LiveQuery, EntityFilter, FieldMetadata, ValueConverter } from 'remult';
import { IBaseEntity, IListResult, IQueryOptions, LiveQueryCallback } from './types';
import { debounce } from 'lodash-es';
import { useEffect } from 'react';

export class ListStore<T extends IBaseEntity<T>> {
  queryOptions: IQueryOptions<T> = {
    page: 1,
    pageSize: 10
  };

  state = {
    data: [] as T[],
    total: 0,
    loading: false,
  };

  constructor(
    private repository: Repository<T>,
  ) {
    makeAutoObservable(this);
  }

  buildQuery(options?: IQueryOptions<T>) {
    const { page = 1, pageSize = 10, searchText, where, orderBy } = options!

    const query: FindOptions<T> = {
      where,
      limit: pageSize,
      page,
      orderBy
    };

    // Build search conditions
    if (searchText) {
      const fields = this.repository.metadata.fields as { [K in keyof T]: FieldMetadata<T, any> };

      const searchableFields = Object.entries(fields)
        .filter(([_, field]) => {
          return field.dbName!!
        })
        .map(([key]) => key);


      if (searchableFields.length > 0) {
        const searchConditions = searchableFields.map(field => ({
          [field]: { $contains: searchText }
        }));

        const searchFilter = { $or: searchConditions } as EntityFilter<T>;

        query.where = where
          ? { $and: [where, searchFilter] } as EntityFilter<T>
          : searchFilter;
      }
    }

    return query;
  }

  liveQuery = debounce((opts, callback) => {
    const query = this.buildQuery(opts);
    return this.repository.liveQuery(query).subscribe(async changes => {
      runInAction(() => {
        this.state.data = changes.items;
        this.state.loading = false;
      })
      callback?.(changes);
    });
  }, 300);

  useList(
    options?: Partial<IQueryOptions<T>>,
    callback?: LiveQueryCallback<T>
  ) {
    useEffect(() => {
      this.setQuery(options as any);
    }, [])

    useEffect(() => {
      this.list(this.queryOptions);
      if (this.queryOptions.live) {
        return this.liveQuery(this.queryOptions, callback)
      }
    }, [JSON.stringify(this.queryOptions)]);

    return {
      data: this.state.data,
      loading: this.state.loading,
      total: this.state.total,
      page: this.queryOptions.page,
      pageSize: this.queryOptions.pageSize,
      searchText: this.queryOptions.searchText,
    };
  }

  async list(options?: IQueryOptions<T>): Promise<IListResult<T>> {
    this.state.loading = true;

    try {
      const query = this.buildQuery(options);
      const [items, total] = await Promise.all([
        this.repository.find(query),
        this.repository.count(query.where)
      ])


      const result = {
        data: items,
        total,
        page: query.page!,
        pageSize: query.limit!
      };

      runInAction(() => {
        Object.assign(this.state, result, { loading: false });
      })
      return result;
    } catch (error) {
      this.state.loading = false;
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    this.state.loading = true;

    try {
      const item = await this.repository.insert(data);
      this.state.total += 1;
      this.state.loading = false;
      return item;
    } catch (error) {
      this.state.loading = false;
      throw error;
    }
  }

  async update(id: T['id'], data: Partial<T>): Promise<T> {
    this.state.loading = true;

    try {
      const item = await this.repository.update(id, data);
      this.state.data = this.state.data.map(d =>
        d.id === id ? item : d
      );
      this.state.loading = false;
      return item;
    } catch (error) {
      this.state.loading = false;
      throw error;
    }
  }

  async delete(id: T['id']): Promise<void> {
    this.state.loading = true;

    try {
      await this.repository.delete(id);
      this.state.data = this.state.data.filter(d => d.id !== id);
      this.state.total -= 1;
      this.state.loading = false;
    } catch (error) {
      this.state.loading = false;
      throw error;
    }
  }

  setQuery(state: Partial<IQueryOptions<T>> = {}) {
    runInAction(() => {
      if (state.searchText || state.pageSize) {
        state.page = 1
      }
      Object.assign(this.queryOptions, state);
    })
  }

  setState(state: Partial<IListResult<T>>) {
    Object.assign(this.state, state);
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
    this.queryOptions = {
      page: 1,
      pageSize: 10
    };
    return this.list(this.queryOptions);
  }
}
