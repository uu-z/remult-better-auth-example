import { makeAutoObservable, runInAction } from 'mobx';
import { Repository, EntityFilter, LiveQuery } from 'remult';
import { IBaseEntity, LiveQueryCallback } from './types';
import { useEffect } from 'react';

export class DetailStore<T extends IBaseEntity<T>> {
  private liveQueries: Map<string, LiveQuery<T> & { unsubscribe?: VoidFunction }> = new Map();

  state = {
    data: null as T | null,
    loading: false
  };

  constructor(private repository: Repository<T>) {
    makeAutoObservable(this);
  }

  private stopLiveQuery(key: string) {
    const liveQuery = this.liveQueries.get(key);
    if (liveQuery) {
      liveQuery.unsubscribe?.();
      this.liveQueries.delete(key);
    }
  }

  async liveGet(
    id: string | number,
    callback?: LiveQueryCallback<T>
  ): Promise<T | null> {
    const queryKey = `detail_${id}`;
    this.stopLiveQuery(queryKey);

    runInAction(() => {
      this.state.loading = true;
    });

    try {
      const options: any = { where: { id } };
      const liveQuery = this.repository.liveQuery(options);
      this.liveQueries.set(queryKey, liveQuery);

      liveQuery.subscribe(changes => {
        runInAction(() => {
          this.state.data = changes.items[0] || null;
          this.state.loading = false;
        });

        //@ts-ignore
        callback?.(changes);
      });

      const item = await this.repository.findFirst(options);

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

  useLive(id: string | number, callback?: LiveQueryCallback<T>) {
    const queryKey = `detail_${id}`;

    useEffect(() => {
      this.liveGet(id, callback);
      return () => this.stopLiveQuery(queryKey);
    }, [id]);

    return {
      data: this.state.data,
      loading: this.state.loading,
    };
  }

  stopAllLiveQueries() {
    this.liveQueries.forEach(liveQuery => liveQuery.unsubscribe?.());
    this.liveQueries.clear();
  }
}
