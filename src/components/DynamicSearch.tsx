import React from "react";
import { observer } from "mobx-react-lite";
import { getMetadata } from "@/lib/decorators";
import { getUIEntityMetadata } from "@/lib/ui-entity-decorator";
import clsx from "clsx";
import { RemultStore } from "@/lib/mobx-remult/remult-store";
import { IBaseEntity } from "@/lib/mobx-remult/types";

interface DynamicSearchProps<T extends IBaseEntity<T>> {
  remultStore: RemultStore<T>;
}

const DynamicSearch = observer(
  <T extends IBaseEntity<T>>({ remultStore }: DynamicSearchProps<T>) => {
    const entity = remultStore.entityType;
    const store = remultStore.list;
    const searchFields: any[] = React.useMemo(
      () => getMetadata(entity, "SEARCH"),
      [entity]
    );
    const uiMetadata = React.useMemo(
      () => getUIEntityMetadata(entity),
      [entity]
    );
    const searchConfig = uiMetadata.searchConfig || {};

    const handleChange = (name: string, value: any) => {
      console.log("Changing field:", name, value);
      if (name === "searchText") {
        // Global fuzzy search
        store.setQuery({
          searchText: value,
          page: 1,
          // Clear field-specific filters when using global search
          ...Object.fromEntries(
            searchFields.map(({ name }) => [name, undefined])
          ),
        });
      } else {
        // Field-specific search
        store.setQuery({
          [name]: value,
          page: 1,
          // Clear global search when using field filters
          searchText: undefined,
        });
      }
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Search */}
        {(uiMetadata.searchFields || []).length > 0 && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={store.queryOptions.searchText || ""}
              onChange={(e) => handleChange("searchText", e.target.value)}
              placeholder={searchConfig.placeholder || "Search all fields..."}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        )}

        {/* Field-specific filters */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {store.state.total} results found
          </span>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-4 h-4 mr-2 -ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-4 h-4 mr-2 -ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              Search
            </button>
          </div>
        </div>
      </form>
    );
  }
);

export default DynamicSearch;
