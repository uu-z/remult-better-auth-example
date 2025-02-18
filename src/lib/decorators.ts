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
  visible?: boolean;
}

interface ValidationOptions {
  pattern?: string;
  message?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

interface RenderOptions {
  render?: (value: any, record: any) => string | JSX.Element;
}

interface ComponentOptions {
  component?: 'input' | 'textarea' | 'select' | 'checkbox' | 'date' | 'text' | 'tag' | 'image' | 'link' | 'dateRange' | 'range';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface UnifiedUIOptions extends BaseUIOptions {
  form?: {
    width?: 'full' | '1/2' | '1/3' | '1/4';
    validation?: ValidationOptions;
  } & ComponentOptions;

  table?: {
    width?: number;
    sortable?: boolean;
    filterable?: boolean;
  } & RenderOptions;

  search?: {
    searchable?: boolean;
    operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'range';
    type?: 'string' | 'number' | 'boolean' | 'date';
  } & ComponentOptions;

  detail?: RenderOptions & ComponentOptions;
}

const metadataCache = new WeakMap<object, Map<string, UnifiedUIOptions>>();

function createUIDecorator(options: UnifiedUIOptions) {
  return function (target: any, propertyKey: string) {
    let cache = metadataCache.get(target);
    if (!cache) {
      cache = new Map();
      metadataCache.set(target, cache);
    }
    cache.set(propertyKey, options);

    // Store metadata for each view type if specified
    if (options.form) {
      Reflect.defineMetadata(UI_METADATA_KEY.FORM, options.form, target, propertyKey);
    }
    if (options.table) {
      Reflect.defineMetadata(UI_METADATA_KEY.TABLE, options.table, target, propertyKey);
    }
    if (options.search) {
      Reflect.defineMetadata(UI_METADATA_KEY.SEARCH, options.search, target, propertyKey);
    }
    if (options.detail) {
      Reflect.defineMetadata(UI_METADATA_KEY.DETAIL, options.detail, target, propertyKey);
    }
  };
}

export const UIFields = createUIDecorator;

export function getMetadata(entityClass: any, type: keyof typeof UI_METADATA_KEY) {
  const prototype = entityClass.prototype;
  const metadataKey = UI_METADATA_KEY[type];
  const cached = metadataCache.get(prototype);

  if (!cached) {
    return [];
  }

  return Array.from(cached.entries())
    .filter(([_, options]) => options[type.toLowerCase()])
    .map(([name, options]) => ({
      name,
      metadata: {
        // Include root level properties
        label: options.label,
        order: options.order,
        visible: options.visible,
        // Merge with view-specific properties
        ...options[type.toLowerCase()]
      }
    }))
    .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0));
}
