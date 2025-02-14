import { makeAutoObservable, runInAction } from 'mobx';
import { Repository, EntityFilter, LiveQuery } from 'remult';
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


  useLive(
    id: string | number,
    callback?: LiveQueryCallback<T>
  ): VoidFunction {

    runInAction(() => {
      this.state.loading = true;
    });

    const options: any = { where: { id } };
    const liveQuery = this.repository.liveQuery(options);


    if (!this.state.data) {
      this.get(options)
    }

    return liveQuery.subscribe(changes => {
      runInAction(() => {
        this.state.data = changes.items[0] || null;
        this.state.loading = false;
      });

      //@ts-ignore
      callback?.(changes);
    });

  }

  async get(where: EntityFilter<T>): Promise<T | null> {
    runInAction(() => {
      this.state.loading = true;
    });

    try {
      const item = await this.repository.findFirst(where);

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
