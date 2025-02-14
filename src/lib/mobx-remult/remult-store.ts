import { remult, Repository } from 'remult';
import { IBaseEntity, EntityType } from './types';
import { BaseStore } from './base-store';
import { ListStore } from './list-store';
import { DetailStore } from './detail-store';
import { FormStore } from './form-store';
import { makeAutoObservable } from 'mobx';

export class RemultStore<T extends IBaseEntity<T>> extends BaseStore<T> {
  list: ListStore<T>;
  detail: DetailStore<T>;
  form: FormStore<T>;

  static instances = new Map<EntityType<any>, RemultStore<any>>();

  private constructor(repository: Repository<T>, entityType: EntityType<T>) {
    super(repository, entityType);
    this.list = new ListStore<T>(repository);
    this.detail = new DetailStore<T>(repository);
    this.form = new FormStore<T>(repository);
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

  stopAllLiveQueries() {
    this.list.stopAllLiveQueries();
    this.detail.stopAllLiveQueries();
  }
}
