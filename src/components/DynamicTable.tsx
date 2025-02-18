import React from "react";
import { observer } from "mobx-react-lite";
import { getMetadata } from "@/lib/decorators";
import { getUIEntityMetadata } from "@/lib/ui-entity-decorator";
import clsx from "clsx";
import { RemultStore } from "@/lib/mobx-remult/remult-store";
import { IBaseEntity } from "@/lib/mobx-remult/types";
import DynamicFormModal from "./DynamicFormModal";

interface DynamicTableProps<T extends IBaseEntity<T>> {
  remultStore?: RemultStore<T>;
}

const DynamicTable = observer(
  <T extends IBaseEntity<T>>({ remultStore }: DynamicTableProps<T>) => {
    const entity = remultStore?.entityType;
    const store = remultStore?.list!;
    const uiMetadata = React.useMemo(
      () => getUIEntityMetadata(entity),
      [entity]
    );
    const dense = uiMetadata.layout?.list?.dense;
    const selection = uiMetadata.layout?.list?.selection;
    const rowActions = uiMetadata.layout?.list?.rowActions || [
      "edit",
      "delete",
    ];
    const columns: any[] = React.useMemo(
      () => getMetadata(entity, "TABLE"),
      [entity]
    );

    const [editingId, setEditingId] = React.useState<number | null>(null);

    React.useEffect(() => {
      if (editingId) {
        const item = store.state.data.find((item) => item.id === editingId);
        if (item && remultStore) {
          remultStore.form.initEdit(item);
        }
      }
    }, [editingId, store.state.data, remultStore]);

    const handleEditClick = (id: number) => {
      setEditingId(id);
    };

    const handleEditClose = () => {
      setEditingId(null);
      remultStore?.form.resetForm();
    };

    const handleEditSuccess = () => {
      setEditingId(null);
      store.list();
    };

    const handleSort = (field: string) => {
      const currentOrderBy = store.queryOptions.orderBy as Record<string, any>;
      const direction = currentOrderBy?.[field] === "asc" ? "desc" : "asc";
      store.sort({ [field]: direction } as any);
    };

    const handleFilterChange = (field: string, value: string) => {
      store.setQuery({ [field]: value });
    };

    const currentSort = store.queryOptions.orderBy as Record<string, any>;

    if (store.state.loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Show</label>
            <select
              value={store.queryOptions.pageSize}
              onChange={(e) =>
                store.setQuery({ pageSize: Number(e.target.value), page: 1 })
              }
              className="border rounded px-2 py-1 text-sm"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={store.queryOptions.searchText || ""}
              onChange={(e) =>
                store.setQuery({ searchText: e.target.value, page: 1 })
              }
              placeholder="Search..."
              className="border rounded px-3 py-1"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selection && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        // TODO: Handle select all
                      }}
                    />
                  </th>
                )}
                {columns.map(({ name, metadata }) => (
                  <th
                    key={name}
                    className={clsx(
                      "text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                      dense ? "px-4 py-2" : "px-6 py-3"
                    )}
                    style={{ width: metadata.width }}
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={clsx(
                          metadata.sortable &&
                            "cursor-pointer hover:text-gray-700"
                        )}
                        onClick={() => metadata.sortable && handleSort(name)}
                      >
                        {metadata.label}
                      </span>
                      {metadata.sortable && currentSort?.[name] && (
                        <span>{currentSort[name] === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                    {metadata.filterable && (
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder={`Filter ${metadata.label}`}
                        onChange={(e) =>
                          handleFilterChange(name, e.target.value)
                        }
                        value={store.queryOptions[name] || ""}
                      />
                    )}
                  </th>
                ))}
                {rowActions?.length > 0 && (
                  <th
                    className={clsx(
                      "text-right text-xs font-medium text-gray-500 uppercase tracking-wider",
                      dense ? "px-4 py-2" : "px-6 py-3"
                    )}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {store.state.data.map((item, index) => (
                <tr
                  key={String(item.id) || String(index)}
                  className={clsx("hover:bg-gray-50", dense && "h-8")}
                >
                  {selection && (
                    <td
                      className={clsx(
                        dense ? "px-4" : "px-6",
                        "whitespace-nowrap"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        onChange={(e) => {
                          // TODO: Handle row selection
                        }}
                      />
                    </td>
                  )}
                  {columns.map(({ name, metadata }) => (
                    <td
                      key={name}
                      className={clsx(
                        "whitespace-nowrap text-sm text-gray-900",
                        dense ? "px-4 py-2" : "px-6 py-4",
                        "transition-colors hover:bg-gray-50"
                      )}
                    >
                      {metadata.render
                        ? metadata.render(item[name], item)
                        : item[name]}
                    </td>
                  ))}
                  {rowActions?.length > 0 && (
                    <td
                      className={clsx(
                        "whitespace-nowrap text-right text-sm font-medium space-x-2",
                        dense ? "px-4 py-2" : "px-6 py-4",
                        "transition-colors hover:bg-gray-50"
                      )}
                    >
                      {rowActions?.includes("view") && (
                        <button
                          onClick={() => {
                            // TODO: Handle view action
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View
                        </button>
                      )}
                      {rowActions?.includes("edit") && (
                        <button
                          onClick={() => handleEditClick(Number(item.id))}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      )}
                      {rowActions?.includes("delete") && (
                        <button
                          onClick={() => store.delete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {store.state.data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data available
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-4 px-4">
          <div className="text-sm text-gray-500">
            Showing{" "}
            {Math.min(
              (store.queryOptions.page - 1) * store.queryOptions.pageSize + 1,
              store.state.total
            )}{" "}
            to{" "}
            {Math.min(
              store.queryOptions.page * store.queryOptions.pageSize,
              store.state.total
            )}{" "}
            of {store.state.total} entries
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                store.setQuery({ page: store.queryOptions.page - 1 })
              }
              disabled={store.queryOptions.page <= 1}
              className={clsx(
                "px-3 py-2 rounded-md border shadow-sm transition-colors",
                store.queryOptions.page <= 1
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
            >
              Previous
            </button>
            {Array.from(
              {
                length: Math.ceil(
                  store.state.total / store.queryOptions.pageSize
                ),
              },
              (_, i) => i + 1
            ).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => store.setQuery({ page: pageNum })}
                className={clsx(
                  "px-3 py-2 rounded-md border shadow-sm transition-colors",
                  pageNum === store.queryOptions.page
                    ? "bg-blue-600 text-white border-transparent"
                    : "bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() =>
                store.setQuery({ page: store.queryOptions.page + 1 })
              }
              disabled={
                store.queryOptions.page >=
                Math.ceil(store.state.total / store.queryOptions.pageSize)
              }
              className={clsx(
                "px-3 py-2 rounded-md border shadow-sm transition-colors",
                store.queryOptions.page >=
                  Math.ceil(store.state.total / store.queryOptions.pageSize)
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
            >
              Next
            </button>
          </div>
        </div>
        {remultStore && editingId && (
          <DynamicFormModal
            entity={entity}
            remultStore={remultStore}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    );
  }
);

export default DynamicTable;
