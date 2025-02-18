"use client";

import { observer } from "mobx-react-lite";
import { Product } from "@/shared/product";
import { RemultStore } from "@/lib/mobx-remult/remult-store";
import DynamicTable from "@/components/DynamicTable";
import DynamicSearch from "@/components/DynamicSearch";
import DynamicFormModal from "@/components/DynamicFormModal";

const productStore = RemultStore.Get(Product);
const SearchDemoPage = observer(() => {
  productStore.list.useList();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <button
              onClick={() => productStore.form.initCreate({})}
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
            {productStore.form.state.mode == "create" && (
              <DynamicFormModal
                remultStore={productStore}
                onSuccess={() => productStore.list.list()}
              />
            )}
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <DynamicSearch remultStore={productStore} />
            </div>
            <DynamicTable remultStore={productStore} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default SearchDemoPage;
