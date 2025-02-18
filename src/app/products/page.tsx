"use client";

import { observer } from "mobx-react-lite";
import { Product } from "@/shared/product";
import { RemultStore } from "@/lib/mobx-remult/remult-store";
import DynamicForm from "@/components/DynamicForm";
import DynamicTable from "@/components/DynamicTable";
import DynamicSearch from "@/components/DynamicSearch";

const productStore = RemultStore.Get(Product);

const SearchDemoPage = observer(() => {
  const {
    data: products,
    loading,
    total,
    page,
    pageSize,
    searchText,
  } = productStore.list.useList({});

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Product Search Demo
          </h1>
        </div>
        <div className="p-6">
          <DynamicForm entity={Product} store={productStore.form} />
          <DynamicSearch entity={Product} store={productStore.list} />
          <DynamicTable entity={Product} store={productStore.list} />
        </div>
      </div>
    </div>
  );
});

export default SearchDemoPage;
