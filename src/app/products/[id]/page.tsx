"use client";

import { observer } from "mobx-react-lite";
import { Product } from "@/shared/product";
import { RemultStore } from "@/lib/mobx-remult/remult-store";

const productStore = RemultStore.Get(Product);

const ProductDetailPage = observer(({ params }: { params: { id: string } }) => {
  const { data: product, loading } = productStore.detail.use({
    id: params.id,
    // live: true,
  });

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <h1 className="text-3xl font-bold text-white text-center">
            Product Details
          </h1>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
            </div>
          ) : !product ? (
            <div className="text-center py-10 bg-gray-50 rounded-md">
              <p className="text-gray-500 text-lg">Product not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <p className="text-lg font-semibold">{product.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <p className="text-lg">{product.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <p className="text-lg font-semibold text-blue-600">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Status
                    </label>
                    <span
                      className={`
                        inline-block px-3 py-1 rounded-full text-sm font-medium
                        ${
                          product.inStock
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      `}
                    >
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProductDetailPage;
