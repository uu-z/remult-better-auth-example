import { EntityFilter, FindOptions, LiveQueryChange, IdEntity, EntityOrderBy } from 'remult';
import { idType } from 'remult/src/remult3/remult3';
export interface IBaseEntity<T> {
  id: idType<T>;
  [key: string]: any;
}
export interface EntityType<T> {
  new(...args: any[]): T;
}
export interface IListResult<T> {
  data: T[];
  total: number;
}

export interface IQueryOptions<T> extends FindOptions<T> {
  live?: boolean
  where?: EntityFilter<T>
  orderBy?: EntityOrderBy<T>
  searchText?: string;
  page: number;
  pageSize: number;
}

export type LiveQueryCallback<T> = (changes: LiveQueryChange) => void;
