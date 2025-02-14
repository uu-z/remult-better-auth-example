"use client";

import { observer } from "mobx-react-lite";
import { Product } from "@/shared/product";
import { RemultStore } from "@/lib/mobx-remult/remult-store";

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

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (page: number) => {
    productStore.list.setQuery({ page });
  };
  const handlePageSizeChange = (newSize: number) => {
    productStore.list.setQuery({ pageSize: newSize, page: 1 });
  };
  const handleSearch = (text: string) => {
    productStore.list.setQuery({ searchText: text });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Product Search Demo
          </h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search products..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
            </div>
          ) : (
            <div>
              {searchText && (
                <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  <span className="font-semibold">Searching:</span> "
                  {searchText}"
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        In Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product: Product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-4 py-3">{product.name}</td>
                        <td className="px-4 py-3">{product.category}</td>
                        <td className="px-4 py-3">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${
                              product.inStock
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          `}
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-md">
                  <p className="text-gray-500 text-lg">No products found</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 space-y-4">
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">
                    Items per page:
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    className="px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    page <= 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    page >= totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
              Total products: {total}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SearchDemoPage;
