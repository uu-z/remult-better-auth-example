import { Allow, Entity, Fields } from "remult"
import { UIField } from "@/lib/decorators"
import { UIEntity } from "@/lib/ui-entity-decorator"

@Entity("products", {
    allowApiCrud: true
})
@UIEntity({
    displayName: "Products",
    description: "Manage product catalog and inventory",
    icon: "ShoppingBag",
    group: "Inventory",
    menuOrder: 1,
    defaultSort: { field: "createdAt", order: "desc" },
    searchFields: ["name", "sku", "description"],
    permissions: {
        view: ["admin", "manager", "staff"],
        create: ["admin", "manager"],
        update: ["admin", "manager"],
        delete: ["admin"]
    },
    layout: {
        list: {
            pageSize: 20,
            dense: true,
            selection: true,
            rowActions: ["view", "edit", "delete"],
            bulkActions: ["delete", "export"],
            filters: {
                position: "left",
                collapsed: false
            }
        },
        create: {
            redirect: "list",
            message: "Product created successfully"
        },
        edit: {
            redirect: "list",
            message: "Product updated successfully"
        },
        view: {
            actions: ["edit", "delete"]
        }
    },
    export: {
        enabled: true,
        formats: ["csv", "excel"],
        fields: ["id", "sku", "name", "category", "price", "quantity"]
    },
    import: {
        enabled: true,
        template: true,
        validation: true
    },
    analytics: {
        enabled: true,
        metrics: ["total", "outOfStock", "lowStock"]
    }
})
export class Product {
    @Fields.autoIncrement()
    @UIField.table({
        label: "ID",
        width: 80,
        sortable: true
    })
    @UIField.search({
        label: "ID",
        operator: "equals"
    })
    id = 0

    @Fields.string()
    @UIField.form({
        label: "Product Name",
        placeholder: "Enter product name",
        component: "input",
        width: "full",
        order: 2,
        required: true
    })
    @UIField.table({
        label: "Name",
        sortable: true,
        filterable: true
    })
    @UIField.search({
        label: "Name",
        searchable: true,
        operator: "contains"
    })
    @UIField.detail({
        label: "Product Name",
        component: "text"
    })
    name = ''

    @Fields.string()
    @UIField.form({
        label: "Description",
        placeholder: "Enter product description",
        component: "textarea",
        width: "full",
        order: 3
    })
    @UIField.table({
        label: "Description",
        width: 200,
        render: (value) => value?.length > 50 ? `${value.substring(0, 50)}...` : value
    })
    @UIField.detail({
        label: "Description",
        component: "text"
    })
    description = ''

    @Fields.string()
    @UIField.form({
        label: "Category",
        component: "select",
        options: [
            { value: "健康", label: "健康" },
            { value: "个人护理", label: "个人护理" },
            { value: "家居电器", label: "家居电器" }
        ],
        width: "1/2",
        order: 4
    })
    @UIField.table({
        label: "Category",
        filterable: true,
        render: (value) => value?.charAt(0).toUpperCase() + value.slice(1)
    })
    @UIField.search({
        label: "Category",
        component: "select",
        operator: "equals",
        options: [
            { value: "健康", label: "健康" },
            { value: "个人护理", label: "个人护理" },
            { value: "家居电器", label: "家居电器" }
        ],
    })
    category = ''

    @Fields.number()
    @UIField.form({
        label: "Price",
        placeholder: "Enter price",
        component: "input",
        width: "1/2",
        order: 5,
        validation: {
            min: 0,
            message: "Price must be greater than 0"
        }
    })
    @UIField.table({
        label: "Price",
        sortable: true,
        render: (value) => `$${value.toFixed(2)}`
    })
    @UIField.search({
        label: "Price",
        operator: "range",
        type: "number",
        component: "range"
    })
    price = 0

    @Fields.boolean()
    @UIField.form({
        label: "In Stock",
        component: "checkbox",
        width: "1/4",
        order: 6
    })
    @UIField.table({
        label: "Stock Status",
        render: (value) => value ?
            '<span class="text-green-600">In Stock</span>' :
            '<span class="text-red-600">Out of Stock</span>'
    })
    @UIField.search({
        label: "Stock Status",
        component: "select",
        operator: "equals",
        type: "boolean",
        options: [
            { value: "true", label: "In Stock" },
            { value: "false", label: "Out of Stock" }
        ]
    })
    inStock = true
}
