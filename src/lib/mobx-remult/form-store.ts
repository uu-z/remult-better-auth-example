import { makeAutoObservable, runInAction } from 'mobx';
import { FormEvent } from 'react';
import { IBaseEntity } from './types';
import { Repository } from 'remult';

export class FormStore<T extends IBaseEntity<T>> {
  state = {
    data: null as Partial<T> | null,
    errors: {} as Record<keyof T, string[]>,
    loading: false,
    saving: false
  };

  constructor(private repository: Repository<T>) {
    makeAutoObservable(this);
  }

  initForm(initialValues?: Partial<T>) {
    runInAction(() => {
      this.state.data = initialValues || null;
      this.state.errors = {} as Record<keyof T, string[]>;
      this.state.loading = false;
      this.state.saving = false;
    });
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
      this.state.data = null;
      this.state.errors = {} as Record<keyof T, string[]>;
      this.state.loading = false;
      this.state.saving = false;
    });
  }

  async handleSubmit(e?: FormEvent) {
    e?.preventDefault();

    if (!this.state.data) {
      return;
    }

    runInAction(() => {
      this.state.saving = true;
    });

    try {
      let result: T;
      if (this.state.data.id) {
        result = await this.repository.update(this.state.data.id, this.state.data);
      } else {
        result = await this.repository.insert(this.state.data);
      }

      runInAction(() => {
        this.state.saving = false;
        this.resetForm();
      });

      return result;
    } catch (error) {
      runInAction(() => {
        this.state.saving = false;
        if (error instanceof Error) {
          const validationErrors = (error as any).errors;
          if (validationErrors) {
            this.setFormErrors(validationErrors);
          }
        }
      });
      throw error;
    }
  }

  setFormFromEntity(entity: T) {
    this.initForm(entity);
  }

  use() {
    return {
      data: this.state.data,
      errors: this.state.errors,
      loading: this.state.loading,
      saving: this.state.saving,
      setField: this.setFormField.bind(this),
      setFields: this.setFormFields.bind(this),
      reset: this.resetForm.bind(this),
      submit: this.handleSubmit.bind(this),
      setFromEntity: this.setFormFromEntity.bind(this)
    };
  }
}
