import { Allow, Entity, Fields } from "remult";
import { UIFields } from "@/lib/decorators";
import { UIEntity } from "@/lib/ui-entity-decorator";

@Entity("products", {
  allowApiCrud: true,
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
    delete: ["admin"],
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
        collapsed: false,
      },
    },
    create: {
      redirect: "list",
      message: "Product created successfully",
    },
    edit: {
      redirect: "list",
      message: "Product updated successfully",
    },
    view: {
      actions: ["edit", "delete"],
    },
  },
  export: {
    enabled: true,
    formats: ["csv", "excel"],
    fields: ["id", "sku", "name", "category", "price", "quantity"],
  },
  import: {
    enabled: true,
    template: true,
    validation: true,
  },
  analytics: {
    enabled: true,
    metrics: ["total", "outOfStock", "lowStock"],
  },
})
export class Product {
  @Fields.autoIncrement()
  @UIFields({
    label: "ID",
    table: {
      width: 80,
      sortable: true,
    },
    search: {
      operator: "equals",
    },
  })
  id = 0;

  @Fields.string()
  @UIFields({
    label: "Product Name",
    order: 2,
    form: {
      placeholder: "Enter product name",
      component: "input",
      width: "full",
      validation: {
        required: true,
      },
    },
    table: {
      sortable: true,
      filterable: true,
    },
    search: {
      searchable: true,
      operator: "contains",
    },
    detail: {
      component: "text",
    },
  })
  name = "";

  @Fields.string()
  @UIFields({
    label: "Description",
    order: 3,
    form: {
      placeholder: "Enter product description",
      component: "textarea",
      width: "full",
    },
    table: {
      width: 200,
      render: (value) =>
        value?.length > 50 ? `${value.substring(0, 50)}...` : value,
    },
    detail: {
      component: "text",
    },
  })
  description = "";

  @Fields.string()
  @UIFields({
    label: "Category",
    order: 4,
    form: {
      component: "select",
      options: [
        { value: "健康", label: "健康" },
        { value: "个人护理", label: "个人护理" },
        { value: "家居电器", label: "家居电器" },
      ],
      width: "1/2",
    },
    table: {
      filterable: true,
      render: (value) => value?.charAt(0).toUpperCase() + value.slice(1),
    },
    search: {
      component: "select",
      operator: "equals",
      options: [
        { value: "健康", label: "健康" },
        { value: "个人护理", label: "个人护理" },
        { value: "家居电器", label: "家居电器" },
      ],
    },
  })
  category = "";

  @Fields.number()
  @UIFields({
    label: "Price",
    order: 5,
    form: {
      placeholder: "Enter price",
      component: "input",
      width: "1/2",
      validation: {
        min: 0,
        message: "Price must be greater than 0",
      },
    },
    table: {
      sortable: true,
      render: (value) => `$${value.toFixed(2)}`,
    },
    search: {
      operator: "range",
      type: "number",
      component: "range",
    },
  })
  price = 0;

  @Fields.boolean()
  @UIFields({
    label: "Stock Status",
    order: 6,
    form: {
      component: "checkbox",
      width: "1/4",
    },
    table: {
      render: (value) =>
        value ? (
          <span className="text-green-600">In Stock</span>
        ) : (
          <span className="text-red-600">Out of Stock</span>
        ),
    },
    search: {
      component: "select",
      operator: "equals",
      type: "boolean",
      options: [
        { value: "true", label: "In Stock" },
        { value: "false", label: "Out of Stock" },
      ],
    },
  })
  inStock = true;
}
