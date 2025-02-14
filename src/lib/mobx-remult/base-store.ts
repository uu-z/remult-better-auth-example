import { EntityType, IBaseEntity } from './types';
import { Repository, remult } from 'remult';

export class BaseStore<T extends IBaseEntity<T>> {
  public static instances = new Map<EntityType<any>, BaseStore<any>>();

  protected constructor(protected repository: Repository<T>, protected entityType: EntityType<T>) {
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
    return this.repository.metadata;
  }

  static Get<T extends IBaseEntity<T>>(entityType: EntityType<T>): BaseStore<T> {
    if (!this.instances.has(entityType)) {
      const repo = remult.repo(entityType);
      this.instances.set(
        entityType,
        new BaseStore<T>(repo, entityType)
      );
    }
    return this.instances.get(entityType)!;
  }
}
