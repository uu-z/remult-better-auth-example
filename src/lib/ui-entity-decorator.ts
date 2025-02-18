import { EntityMetadata } from "remult"

export interface UIEntityOptions {
    // Basic Display
    displayName: string
    description?: string
    icon?: string
    group?: string
    menuOrder?: number

    // Permissions
    permissions?: {
        view?: string[]
        create?: string[]
        update?: string[]
        delete?: string[]
        export?: string[]
        import?: string[]
    }

    // Search Configuration
    searchFields?: string[]
    searchConfig?: {
        placeholder?: string
        searchOnChange?: boolean
        debounceTime?: number
        minLength?: number
    }

    // Default Settings
    defaultSort?: {
        field: string
        order: 'asc' | 'desc'
    }
    defaultFilter?: Record<string, any>

    // Layout Configuration
    layout?: {
        // List View Configuration
        list?: {
            pageSize?: number
            pageSizeOptions?: number[]
            dense?: boolean
            selection?: boolean
            expandable?: boolean
            showTotalItems?: boolean
            showQuickJumper?: boolean
            showSizeChanger?: boolean
            rowActions?: Array<'view' | 'edit' | 'delete' | 'duplicate' | string>
            bulkActions?: Array<'delete' | 'export' | string>
            headerActions?: Array<'create' | 'import' | 'export' | string>
            filters?: {
                position?: 'left' | 'top' | 'right'
                collapsed?: boolean
                showReset?: boolean
            }
            columns?: {
                resizable?: boolean
                reorderable?: boolean
                hideableColumns?: boolean
                defaultHiddenColumns?: string[]
            }
            toolbar?: {
                position?: 'top' | 'bottom' | 'both'
                dense?: boolean
                actions?: {
                    position?: 'left' | 'right'
                    showLabels?: boolean
                    showIcons?: boolean
                }
            }
        }

        // Create Form Configuration
        create?: {
            redirect?: 'list' | 'view' | 'edit' | 'create' | string
            message?: string
            layout?: 'vertical' | 'horizontal'
            sections?: Array<{
                title?: string
                description?: string
                collapsed?: boolean
                fields: string[]
            }>
            sidebar?: {
                position?: 'left' | 'right'
                width?: number | string
                components?: string[]
            }
            actions?: {
                position?: 'top' | 'bottom' | 'both'
                align?: 'left' | 'right' | 'center'
                showCancel?: boolean
                customActions?: string[]
            }
        }

        // Edit Form Configuration
        edit?: {
            redirect?: 'list' | 'view' | 'edit' | string
            message?: string
            layout?: 'vertical' | 'horizontal'
            sections?: Array<{
                title?: string
                description?: string
                collapsed?: boolean
                fields: string[]
            }>
            sidebar?: {
                position?: 'left' | 'right'
                width?: number | string
                components?: string[]
            }
            actions?: {
                position?: 'top' | 'bottom' | 'both'
                align?: 'left' | 'right' | 'center'
                showCancel?: boolean
                customActions?: string[]
            }
            versioning?: {
                enabled?: boolean
                showHistory?: boolean
                compareVersions?: boolean
            }
        }

        // Detail View Configuration
        view?: {
            layout?: 'vertical' | 'horizontal' | 'tabs' | 'sections'
            actions?: string[]
            sections?: Array<{
                title?: string
                description?: string
                collapsed?: boolean
                fields: string[]
            }>
            tabs?: Array<{
                key: string
                title: string
                icon?: string
                fields?: string[]
                component?: string
            }>
            relatedEntities?: Array<{
                entity: string
                relationship: 'oneToMany' | 'manyToOne' | 'manyToMany'
                field: string
                display?: {
                    type?: 'table' | 'cards' | 'list'
                    fields?: string[]
                }
            }>
        }
    }

    // Export Configuration
    export?: {
        enabled?: boolean
        formats?: Array<'csv' | 'excel' | 'pdf' | string>
        fields?: string[]
        fileName?: string
        customExporter?: (data: any[]) => Promise<any>
        formatters?: Record<string, (value: any) => any>
        headers?: Record<string, string>
    }

    // Import Configuration
    import?: {
        enabled?: boolean
        template?: boolean
        validation?: boolean
        skipErrors?: boolean
        batchSize?: number
        mapping?: Record<string, string>
        transformers?: Record<string, (value: any) => any>
        onError?: (error: any, row: any) => void
    }

    // Analytics Configuration
    analytics?: {
        enabled?: boolean
        metrics?: string[]
        charts?: Array<{
            type: 'bar' | 'line' | 'pie' | 'area' | string
            title: string
            metric: string
            dimension?: string
            filter?: Record<string, any>
            options?: Record<string, any>
        }>
        dashboard?: {
            layout?: 'grid' | 'flex'
            refresh?: number
            filters?: {
                enabled?: boolean
                fields?: string[]
            }
        }
    }

    // Workflow Configuration
    workflow?: {
        enabled?: boolean
        states?: Array<{
            key: string
            label: string
            color?: string
            actions?: string[]
            permissions?: Record<string, string[]>
        }>
        transitions?: Array<{
            from: string | string[]
            to: string
            action: string
            conditions?: Array<(entity: any) => boolean>
            validation?: Array<(entity: any) => Promise<boolean>>
            sideEffects?: Array<(entity: any) => Promise<void>>
        }>
    }

    // Custom Components
    components?: {
        list?: string
        create?: string
        edit?: string
        view?: string
        import?: string
        export?: string
        filters?: string
    }

    // Hooks
    hooks?: {
        beforeList?: (query: any) => Promise<void>
        afterList?: (items: any[]) => Promise<void>
        beforeCreate?: (entity: any) => Promise<void>
        afterCreate?: (entity: any) => Promise<void>
        beforeUpdate?: (entity: any) => Promise<void>
        afterUpdate?: (entity: any) => Promise<void>
        beforeDelete?: (entity: any) => Promise<void>
        afterDelete?: (entity: any) => Promise<void>
    }

    // API Configuration
    api?: {
        basePath?: string
        endpoints?: {
            list?: string
            create?: string
            update?: string
            delete?: string
            custom?: Record<string, {
                method: 'GET' | 'POST' | 'PUT' | 'DELETE'
                path: string
                handler: (params: any) => Promise<any>
            }>
        }
        middleware?: Array<(req: any, res: any, next: any) => void>
    }

    // Cache Configuration
    cache?: {
        enabled?: boolean
        duration?: number
        keys?: string[]
        storage?: 'memory' | 'redis' | string
        invalidation?: {
            automatic?: boolean
            events?: string[]
        }
    }

    // Audit Configuration
    audit?: {
        enabled?: boolean
        fields?: string[]
        excludeFields?: string[]
        user?: {
            field: string
            type: string
        }
        timestamp?: {
            field: string
            type: string
        }
        storage?: {
            type: 'database' | 'file' | string
            options?: Record<string, any>
        }
    }
}

const uiEntityMetadataKey = Symbol("uiEntityMetadata")

export function UIEntity(options: UIEntityOptions) {
    return function (target: any) {
        const existingMetadata = Reflect.getMetadata(uiEntityMetadataKey, target) || {}
        const metadata = { ...existingMetadata, ...options }
        Reflect.defineMetadata(uiEntityMetadataKey, metadata, target)
    }
}

export function getUIEntityMetadata(target: any): UIEntityOptions {
    return Reflect.getMetadata(uiEntityMetadataKey, target) || {}
}

// Helper function to merge UI metadata with Remult entity metadata
export function mergeUIEntityMetadata(entityMetadata: EntityMetadata<any>) {
    const uiMetadata = getUIEntityMetadata(entityMetadata.entityType)
    return {
        ...entityMetadata,
        uiMetadata
    }
}

// Utility types for type checking and autocompletion
export type UIEntityMetadata<T> = EntityMetadata<T> & {
    uiMetadata: UIEntityOptions
}

export interface UIEntityHooks<T> {
    beforeList?: (query: any) => Promise<void>
    afterList?: (items: T[]) => Promise<void>
    beforeCreate?: (entity: T) => Promise<void>
    afterCreate?: (entity: T) => Promise<void>
    beforeUpdate?: (entity: T) => Promise<void>
    afterUpdate?: (entity: T) => Promise<void>
    beforeDelete?: (entity: T) => Promise<void>
    afterDelete?: (entity: T) => Promise<void>
}

// Type guard to check if metadata includes UI metadata
export function hasUIMetadata<T>(
    metadata: EntityMetadata<T> | UIEntityMetadata<T>
): metadata is UIEntityMetadata<T> {
    return 'uiMetadata' in metadata
}

// Helper function to create a typed UI Entity decorator
export function createUIEntity<T>(options: UIEntityOptions) {
    return UIEntity(options)
}
