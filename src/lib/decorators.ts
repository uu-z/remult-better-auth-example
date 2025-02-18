import 'reflect-metadata';

const UI_METADATA_KEY = {
  FORM: 'ui:form:metadata',
  TABLE: 'ui:table:metadata',
  SEARCH: 'ui:search:metadata',
  DETAIL: 'ui:detail:metadata'
};

interface BaseUIOptions {
  label?: string;
  order?: number;
}

interface FormOptions extends BaseUIOptions {
  placeholder?: string;
  component?: 'input' | 'textarea' | 'select' | 'checkbox' | 'date';
  options?: { value: string; label: string }[];
  width?: 'full' | '1/2' | '1/3' | '1/4';
  required?: boolean;
  validation?: {
    pattern?: string;
    message?: string;
    min?: number;
    max?: number;
  };
}

interface TableOptions extends BaseUIOptions {
  visible?: boolean;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any) => string | JSX.Element;
}

interface SearchOptions extends BaseUIOptions {
  searchable?: boolean;
  operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'range';
  component?: 'input' | 'select' | 'dateRange' | 'range';
  options?: { value: string; label: string }[];
  type?: 'string' | 'number' | 'boolean' | 'date';
}

interface DetailOptions extends BaseUIOptions {
  visible?: boolean;
  component?: 'text' | 'tag' | 'image' | 'link';
  render?: (value: any, record: any) => string | JSX.Element;
}

const metadataCache = new WeakMap<object, {
  form: Map<string, FormOptions>;
  table: Map<string, TableOptions>;
  search: Map<string, SearchOptions>;
  detail: Map<string, DetailOptions>;
}>();

function createDecorator<T>(metadataKey: string) {
  return function (options: T) {
    return function (target: any, propertyKey: string) {
      const cache = metadataCache.get(target) || {
        form: new Map(),
        table: new Map(),
        search: new Map(),
        detail: new Map()
      };

      if (!metadataCache.has(target)) {
        metadataCache.set(target, cache);
      }

      switch (metadataKey) {
        case UI_METADATA_KEY.FORM:
          cache.form.set(propertyKey, options as FormOptions);
          break;
        case UI_METADATA_KEY.TABLE:
          cache.table.set(propertyKey, options as TableOptions);
          break;
        case UI_METADATA_KEY.SEARCH:
          cache.search.set(propertyKey, options as SearchOptions);
          break;
        case UI_METADATA_KEY.DETAIL:
          cache.detail.set(propertyKey, options as DetailOptions);
          break;
      }

      Reflect.defineMetadata(metadataKey, options, target, propertyKey);
    };
  };
}

export const UIField = {
  form: createDecorator<FormOptions>(UI_METADATA_KEY.FORM),
  table: createDecorator<TableOptions>(UI_METADATA_KEY.TABLE),
  search: createDecorator<SearchOptions>(UI_METADATA_KEY.SEARCH),
  detail: createDecorator<DetailOptions>(UI_METADATA_KEY.DETAIL)
};

export function getMetadata(entityClass: any, type: keyof typeof UI_METADATA_KEY) {
  const prototype = entityClass.prototype;
  const metadataKey = UI_METADATA_KEY[type];
  const cached = metadataCache.get(prototype);

  if (cached) {
    return Array.from(cached[type.toLowerCase()].entries())
      //@ts-ignore
      .map(([name, metadata]) => ({ name, metadata }))
      //@ts-ignore
      .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0));
  }

  const metadata = new Map();
  const cache = {
    form: new Map(),
    table: new Map(),
    search: new Map(),
    detail: new Map()
  };
  cache[type.toLowerCase()] = metadata;
  metadataCache.set(prototype, cache);

  const props = new Set<string>();
  let currentPrototype = prototype;

  while (currentPrototype && currentPrototype !== Object.prototype) {
    Object.getOwnPropertyNames(currentPrototype).forEach(prop => props.add(prop));
    currentPrototype = Object.getPrototypeOf(currentPrototype);
  }

  return Array.from(props)
    .filter(prop => {
      const meta = Reflect.getMetadata(metadataKey, prototype, prop);
      if (meta) {
        metadata.set(prop, meta);
        return true;
      }
      return false;
    })
    .map(prop => ({
      name: prop,
      metadata: metadata.get(prop)
    }))
    .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0));
}
