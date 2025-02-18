import React from "react";
import { observer } from "mobx-react-lite";
import { getMetadata } from "@/lib/decorators";
import clsx from "clsx";
import { FormStore } from "@/lib/mobx-remult/form-store";
import { IBaseEntity } from "@/lib/mobx-remult/types";
import { RemultStore } from "@/lib/mobx-remult/remult-store";

interface FormFieldProps {
  name: string;
  metadata: any;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string | string[];
}

const FormField = observer(
  ({ name, metadata, value, onChange, error }: FormFieldProps) => {
    const handleChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const newValue =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      onChange(name, newValue);
    };

    const baseClasses =
      "border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none";
    const widthClass = `w-${metadata.width}`;
    const errorClass = error ? "border-red-500" : "border-gray-300";

    switch (metadata.component) {
      case "textarea":
        return (
          <textarea
            name={name}
            value={value || ""}
            placeholder={metadata.placeholder}
            onChange={handleChange}
            className={clsx(baseClasses, widthClass, errorClass, "h-32")}
          />
        );

      case "select":
        return (
          <select
            name={name}
            value={value || ""}
            onChange={handleChange}
            className={clsx(baseClasses, widthClass, errorClass)}
          >
            <option value="">Select {metadata.label}</option>
            {metadata.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            name={name}
            checked={value || false}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        );

      default:
        return (
          <input
            type={metadata.type || "text"}
            name={name}
            value={value || ""}
            placeholder={metadata.placeholder}
            onChange={handleChange}
            className={clsx(baseClasses, widthClass, errorClass)}
          />
        );
    }
  }
);

interface DynamicFormProps<T extends IBaseEntity<T>> {
  entity: any;
  remultStore: RemultStore<T>;
  onSuccess?: () => void;
}

const DynamicForm = observer(
  <T extends IBaseEntity<T>>({
    remultStore,
    onSuccess,
  }: DynamicFormProps<T>) => {
    const entity = remultStore.entityType;
    const store = remultStore.form;
    const { data: formData, errors, saving, setField, submit } = store.use();
    const fields: any[] = React.useMemo(
      () => getMetadata(entity, "FORM"),
      [entity]
    );

    const handleChange = (name: string, value: any) => {
      setField(name as any, value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await submit(e);
      if (result) {
        onSuccess?.();
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(({ name, metadata }) => (
            <div
              key={name}
              className={clsx(
                "space-y-1",
                metadata.width === "full" && "md:col-span-2"
              )}
            >
              <label className="block text-sm font-medium text-gray-700">
                {metadata.label}
                {metadata.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <FormField
                name={name}
                metadata={metadata}
                value={formData?.[name] ?? ""}
                onChange={handleChange}
                error={errors[name]}
              />
              {errors[name] && (
                <p className="text-sm text-red-500">
                  {Array.isArray(errors[name])
                    ? errors[name].join(", ")
                    : errors[name]}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => store.resetForm()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className={clsx(
              "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md",
              saving ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            )}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    );
  }
);

export default DynamicForm;
