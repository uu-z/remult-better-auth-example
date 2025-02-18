import React from "react";
import { observer } from "mobx-react-lite";
import { getMetadata } from "@/lib/decorators";
import clsx from "clsx";
import { ListStore } from "@/lib/mobx-remult/list-store";
import { IBaseEntity } from "@/lib/mobx-remult/types";

interface DynamicSearchProps<T extends IBaseEntity<T>> {
  entity: any;
  store: ListStore<T>;
}

const DynamicSearch = observer(
  <T extends IBaseEntity<T>>({ entity, store }: DynamicSearchProps<T>) => {
    const searchFields: any[] = React.useMemo(
      () => getMetadata(entity, "SEARCH"),
      [entity]
    );

    const handleChange = (name: string, value: any) => {
      console.log("Changing field:", name, value);
      store.setQuery({ [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Submitting search with options:", store.queryOptions);
      await store.list(store.queryOptions);
    };

    const handleReset = async () => {
      await store.reset();
      console.log("After reset:", store.queryOptions);
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded-lg shadow"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {searchFields.map(({ name, metadata }) => (
            <div key={name} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {metadata.label}
              </label>
              {metadata.component === "select" ? (
                <select
                  value={store.queryOptions[name] || ""}
                  onChange={(e) => handleChange(name, e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  {metadata.options?.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : metadata.operator === "range" ||
                metadata.component === "range" ? (
                <div className="flex space-x-2">
                  <input
                    type={metadata.type === "date" ? "date" : "number"}
                    value={store.queryOptions[`${name}Min`] || ""}
                    onChange={(e) => {
                      console.log("Setting Min:", name, e.target.value);
                      handleChange(`${name}Min`, e.target.value);
                    }}
                    placeholder={`Min ${metadata.label}`}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type={metadata.type === "date" ? "date" : "number"}
                    value={store.queryOptions[`${name}Max`] || ""}
                    onChange={(e) => {
                      console.log("Setting Max:", name, e.target.value);
                      handleChange(`${name}Max`, e.target.value);
                    }}
                    placeholder={`Max ${metadata.label}`}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <input
                  type={metadata.type === "number" ? "number" : "text"}
                  value={store.queryOptions[name] || ""}
                  onChange={(e) => handleChange(name, e.target.value)}
                  placeholder={`Search by ${metadata.label.toLowerCase()}`}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>
    );
  }
);

export default DynamicSearch;
