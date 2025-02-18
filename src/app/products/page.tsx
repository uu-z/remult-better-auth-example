"use client";

import { observer } from "mobx-react-lite";
import { Product } from "@/shared/product";
import { RemultStore } from "@/lib/mobx-remult/remult-store";
import DynamicForm from "@/components/DynamicForm";
import DynamicTable from "@/components/DynamicTable";
import DynamicSearch from "@/components/DynamicSearch";
import { getUIEntityMetadata } from "@/lib/ui-entity-decorator";

const productStore = RemultStore.Get(Product);
const SearchDemoPage = observer(() => {
  const {
    data: products,
    loading,
    total,
    page,
    pageSize,
    searchText,
  } = productStore.list.useList();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <button
              onClick={() => productStore.form.initForm({})}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-4 h-4 mr-2 -ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Product
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <DynamicSearch entity={Product} store={productStore.list} />
            </div>
            <DynamicTable entity={Product} store={productStore.list} />
          </div>
        </div>

        {/* Form Modal */}
        {productStore.form.state.data && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {productStore.form.state.data.id
                      ? "Edit Product"
                      : "Create Product"}
                  </h2>
                  <button
                    onClick={() => {
                      console.log("Resetting form...");
                      productStore.form.resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
                  >
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <DynamicForm entity={Product} store={productStore.form} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SearchDemoPage;
