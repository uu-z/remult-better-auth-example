import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Repository, FindOptions, LiveQuery, EntityFilter, FieldMetadata, ValueConverter } from 'remult';
import { IBaseEntity, IListResult, IQueryOptions, LiveQueryCallback } from './types';
import { useEffect } from 'react';
import { Debounce } from '../utils';
import { getMetadata } from '../decorators';

interface SearchMetadata {
  operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'range';
  type?: 'string' | 'number' | 'boolean' | 'date';
  options?: { value: string; label: string }[];
}

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
    const { page = 1, pageSize = 10, searchText, where, orderBy, ...rest } = options || this.queryOptions

    const query: FindOptions<T> = {
      where,
      limit: pageSize,
      page,
      orderBy
    };

    const conditions: any[] = [];
    if (where) conditions.push(where);

    // Handle global search text
    if (searchText) {
      const fields = this.repository.metadata.fields as { [K in keyof T]: FieldMetadata<T, any> };
      const searchableFields = Object.entries(fields)
        .filter(([_, field]) => field.dbName !== undefined)
        .map(([key]) => key);

      if (searchableFields.length > 0) {
        const searchConditions = searchableFields.map(field => ({
          [field]: { $contains: searchText }
        }));
        conditions.push({ $or: searchConditions });
      }
    }

    // Handle field-specific search conditions from metadata
    const searchMetadata = getMetadata(this.repository.metadata.entityType, 'SEARCH') as { name: string; metadata: SearchMetadata }[];
    const searchFields = new Map<string, SearchMetadata>(
      searchMetadata.map(({ name, metadata }) => [name, metadata])
    );

    Object.entries(rest).forEach(([key, value]) => {
      if (!value || value === '') return;

      if (key.endsWith('Min') || key.endsWith('Max')) {
        const baseField = key.replace(/Min$|Max$/, '');
        const fieldMeta = searchFields.get(baseField) || {} as SearchMetadata;
        const fieldType = fieldMeta.type || 'string';
        const operator = key.endsWith('Min') ? '$gte' : '$lte';
        const convertedValue = fieldType === 'number' ? Number(value) : value;

        conditions.push({
          [baseField]: { [operator]: convertedValue }
        });
      } else {
        const fieldMeta = searchFields.get(key) || {} as SearchMetadata;
        const operator = fieldMeta.operator || 'equals';
        const type = fieldMeta.type || 'string';

        switch (operator) {
          case 'contains':
            conditions.push({ [key]: { $contains: value } });
            break;
          case 'startsWith':
            conditions.push({ [key]: { $startsWith: value } });
            break;
          case 'endsWith':
            conditions.push({ [key]: { $endsWith: value } });
            break;
          case 'equals':
            if (type === 'boolean') {
              conditions.push({ [key]: value === 'true' });
            } else {
              conditions.push({ [key]: value });
            }
            break;
          case 'range':
            // Range is handled by Min/Max above
            break;
        }
      }
    });

    if (conditions.length > 0) {
      query.where = conditions.length === 1 ? conditions[0] : { $and: conditions } as EntityFilter<T>;
      // console.log('Final Query:', JSON.stringify(query.where, null, 2));
    }

    return query;
  }

  @Debounce(300)
  liveQuery(opts: IQueryOptions<T>, callback: LiveQueryCallback<T> | undefined) {
    const query = this.buildQuery(opts);
    return this.repository.liveQuery(query).subscribe(async changes => {
      runInAction(() => {
        this.state.data = changes.items;
        this.setState({ loading: false })
      })
      //@ts-ignore
      callback?.(changes);
    });
  }

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

  @Debounce(300)
  async list(options?: IQueryOptions<T>): Promise<IListResult<T>> {
    this.setState({ loading: true });

    try {
      const query = this.buildQuery(options);
      const [items, total] = await Promise.all([
        this.repository.find(query),
        this.repository.count(query.where)
      ]);

      const result = {
        data: items,
        total,
        page: query.page!,
        pageSize: query.limit!
      };

      runInAction(() => {
        Object.assign(this.state, result, { loading: false });
      });
      return result;
    } catch (error) {
      this.setState({ loading: false });
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    this.setState({ loading: true })

    try {
      const item = await this.repository.insert(data);
      this.state.total += 1;
      this.setState({ loading: true })
      return item;
    } catch (error) {
      this.setState({ loading: false })
      throw error;
    }
  }

  async update(id: T['id'], data: Partial<T>): Promise<T> {
    this.setState({ loading: false })
    try {
      const item = await this.repository.update(id, data);
      runInAction(() => {
        this.state.data = this.state.data.map(d =>
          d.id === id ? item : d
        );
      })
      this.setState({ loading: false })
      return item;
    } catch (error) {
      this.setState({ loading: false })
      throw error;
    }
  }

  async delete(id: T['id']): Promise<void> {
    this.setState({ loading: true })

    try {
      await this.repository.delete(id);
      this.state.data = this.state.data.filter(d => d.id !== id);
      this.state.total -= 1;
      this.setState({ loading: false })
    } catch (error) {
      this.setState({ loading: false })
      throw error;
    }
  }

  setQuery(state: Partial<IQueryOptions<T>> = {}) {
    runInAction(() => {
      if (state.searchText || state.pageSize) {
        state.page = 1;
      }

      // Handle range query parameters
      const newState = { ...state };
      Object.entries(state).forEach(([key, value]) => {
        if (key.endsWith('Min') || key.endsWith('Max')) {
          if (value === '') {
            delete newState[key];
          }
        }
      });

      // console.log('Setting Query:', newState);
      Object.assign(this.queryOptions, newState);
    });
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
    runInAction(() => {
      // Clear all query options except pageSize
      const { pageSize } = this.queryOptions;
      this.queryOptions = { page: 1, pageSize };
      // console.log('Reset Query Options:', this.queryOptions);
    });
    return this.list(this.queryOptions);
  }
}
