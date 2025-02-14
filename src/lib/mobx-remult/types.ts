import { FindOptions, EntityFilter, LiveQueryChange } from 'remult';
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

export interface IListResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EntityType<T> {
  new(...args: any[]): T;
}

export type LiveQueryCallback<T> = (change: LiveQueryChange) => void;
