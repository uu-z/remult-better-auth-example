import React from "react";
import { observer } from "mobx-react-lite";
import { IBaseEntity } from "@/lib/mobx-remult/types";
import { RemultStore } from "@/lib/mobx-remult/remult-store";
import { getUIEntityMetadata } from "@/lib/ui-entity-decorator";
import DynamicForm from "./DynamicForm";

interface DynamicFormModalProps<T extends IBaseEntity<T>> {
  remultStore: RemultStore<T>;
  onSuccess?: () => void;
}

const DynamicFormModal = observer(
  <T extends IBaseEntity<T>>({
    remultStore,
    onSuccess,
  }: DynamicFormModalProps<T>) => {
    const entity = remultStore.entityType;
    const uiMetadata = React.useMemo(
      () => getUIEntityMetadata(entity),
      [entity]
    );

    const handleSuccess = () => {
      remultStore.form.resetForm();
      onSuccess?.();
    };

    if (!remultStore.form.state.data) return null;

    const isEdit = !!remultStore.form.state.data.id;
    const title = isEdit
      ? `Edit ${uiMetadata.displayName?.slice(0, -1) || "Item"}`
      : `Create ${uiMetadata.displayName?.slice(0, -1) || "Item"}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={() => remultStore.form.resetForm()}
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
            <DynamicForm
              entity={entity}
              remultStore={remultStore}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default DynamicFormModal;
