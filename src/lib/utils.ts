import { debounce } from "lodash-es";

export function Debounce(wait: number) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        descriptor.value = debounce(originalMethod, wait);

        return descriptor;
    };
}
