import { makeAutoObservable, runInAction } from 'mobx';
import { FormEvent } from 'react';
import { IBaseEntity } from './types';
import { Repository } from 'remult';

export class FormStore<T extends IBaseEntity<T>> {
  state = {
    mode: 'create' as 'create' | 'edit',
    data: null as Partial<T> | null,
    errors: {} as Record<keyof T, string[]>,
    loading: false,
    saving: false,
    originalData: null as T | null
  };

  callbacks = {
    onSuccess: null as ((result: T) => void) | null,
    onError: null as ((error: Error) => void) | null
  };

  constructor(private repository: Repository<T>) {
    makeAutoObservable(this);
  }

  initCreate(initialValues?: Partial<T>) {
    runInAction(() => {
      this.state.mode = 'create';
      this.state.data = initialValues || {};
      this.state.errors = {} as Record<keyof T, string[]>;
      this.state.loading = false;
      this.state.saving = false;
      this.state.originalData = null;
    });
  }

  initEdit(entity: T) {
    runInAction(() => {
      this.state.mode = 'edit';
      this.state.data = { ...entity };
      this.state.errors = {} as Record<keyof T, string[]>;
      this.state.loading = false;
      this.state.saving = false;
      this.state.originalData = entity;
    });
  }

  setCallbacks(callbacks: {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  }) {
    this.callbacks.onSuccess = callbacks.onSuccess || null;
    this.callbacks.onError = callbacks.onError || null;
  }


  setFormField<K extends keyof T>(field: K, value: T[K]) {
    runInAction(() => {
      if (!this.state.data) {
        this.state.data = {} as Partial<T>;
      }
      this.state.data[field] = value;
      if (this.state.errors[field]) {
        delete this.state.errors[field];
      }
    });
  }

  setFormFields(fields: Partial<T>) {
    runInAction(() => {
      this.state.data = {
        ...this.state.data,
        ...fields
      };
      Object.keys(fields).forEach(key => {
        if (this.state.errors[key as keyof T]) {
          delete this.state.errors[key as keyof T];
        }
      });
    });
  }

  setFormErrors(errors: Record<keyof T, string[]>) {
    runInAction(() => {
      this.state.errors = errors;
    });
  }

  resetForm() {
    runInAction(() => {
      this.state.mode = 'create';
      this.state.data = null;
      this.state.errors = {} as Record<keyof T, string[]>;
      this.state.loading = false;
      this.state.saving = false;
      this.state.originalData = null;
      this.callbacks.onSuccess = null;
      this.callbacks.onError = null;
    });
  }

  hasChanges() {
    if (this.state.mode === 'create') {
      return Object.keys(this.state.data || {}).length > 0;
    }
    if (!this.state.originalData || !this.state.data) return false;
    return Object.keys(this.state.data).some(
      key => this.state.data?.[key as keyof T] !== this.state.originalData?.[key as keyof T]
    );
  }

  async handleSubmit(e?: FormEvent) {
    e?.preventDefault();

    if (!this.state.data) {
      return;
    }

    if (!this.hasChanges()) {
      return this.state.originalData || null;
    }

    runInAction(() => {
      this.state.saving = true;
    });

    try {
      let result: T;
      if (this.state.mode === 'edit' && this.state.data.id) {
        result = await this.repository.update(this.state.data.id, this.state.data);
      } else {
        result = await this.repository.insert(this.state.data);
      }

      runInAction(() => {
        this.state.saving = false;
        this.state.originalData = result;
      });

      this.callbacks.onSuccess?.(result);
      return result;
    } catch (error) {
      runInAction(() => {
        this.state.saving = false;
        if (error instanceof Error) {
          const validationErrors = (error as any).errors;
          if (validationErrors) {
            this.setFormErrors(validationErrors);
          }
          this.callbacks.onError?.(error);
        }
      });
      throw error;
    }
  }

  setFormFromEntity(entity: T) {
    this.initEdit(entity);
  }

  use() {
    return {
      mode: this.state.mode,
      data: this.state.data,
      errors: this.state.errors,
      loading: this.state.loading,
      saving: this.state.saving,
      hasChanges: this.hasChanges.bind(this),
      setField: this.setFormField.bind(this),
      setFields: this.setFormFields.bind(this),
      reset: this.resetForm.bind(this),
      submit: this.handleSubmit.bind(this),
      setFromEntity: this.setFormFromEntity.bind(this),
      setCallbacks: this.setCallbacks.bind(this)
    };
  }
}
