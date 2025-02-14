import { makeAutoObservable, runInAction } from 'mobx';
import { Repository, EntityFilter, LiveQuery, FindFirstOptions } from 'remult';
import { IBaseEntity, LiveQueryCallback } from './types';
import { useEffect } from 'react';



export class DetailStore<T extends IBaseEntity<T>> {
  state = {
    data: null as T | null,
    loading: false
  };

  constructor(private repository: Repository<T>) {
    makeAutoObservable(this);
  }


  use({ id, live }: { id: string | number, live?: boolean }, callback?: LiveQueryCallback<T>) {

    useEffect(() => {
      const options: any = { where: { id } };

      this.get(options);
      if (live) {
        const liveQuery = this.repository.liveQuery(options);
        return liveQuery.subscribe(changes => {
          runInAction(() => {
            this.state.data = changes.items[0] || null;
            this.state.loading = false;
          });
          //@ts-ignore
          callback?.(changes);
        });
      }
    }, [id]);

    return {
      data: this.state.data,
      loading: this.state.loading,
    };
  }

  async get(args: { where: EntityFilter<T>, options?: FindFirstOptions<T> }): Promise<T | null> {
    runInAction(() => {
      this.state.loading = true;
    });
    try {
      const item = await this.repository.findFirst(args.where, args.options);

      runInAction(() => {
        this.state.data = item;
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
}
