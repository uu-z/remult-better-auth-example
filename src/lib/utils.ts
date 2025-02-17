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


export class ObjectPool {
    private static pool = new WeakMap<object, any>();
    private static keys = new Map<string, object>();

    static get<T extends (...args: any[]) => any, U = ReturnType<T>>(key: string, func: T): U {
        let keyObj = ObjectPool.keys.get(key);

        if (!keyObj) {
            keyObj = { key };
            ObjectPool.keys.set(key, keyObj);
        }

        if (!ObjectPool.pool.has(keyObj)) {
            ObjectPool.pool.set(keyObj, func());
        }

        return ObjectPool.pool.get(keyObj);
    }
}


const cache = new WeakMap()

export function WeakWrap<T extends object, R>(object: T, factory: () => R): R {
    console.log(object, cache.has(object))
    if (!cache.has(object)) {
        cache.set(object, factory());
    }

    return cache.get(object)!;
}
