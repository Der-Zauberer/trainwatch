import { ref, watch, type Ref } from "vue";

export type XRefValue<T> = ((request: XRefRequest) => Promise<T> | T | undefined) | Promise<T> | T | undefined

export type XRef<T> = Ref<T> & {
    readonly error: Ref<unknown | undefined>
    readonly status: Ref<XRefStatus>
    reload: (value?: XRefValue<T>) => XRef<T>
}

export type XRefOptions<T> = {
    parameter: Ref<unknown | undefined>[]
    initializer?: XRefValue<T>
    loader: XRefValue<T>
}

export type XRefRequest = {
    parameter: Ref<unknown | undefined>[]
    abortSignal: AbortSignal
}

export enum XRefStatus { EMPTY, LOADING, RESOLVED, ERROR }

export function xref<T>(options: XRefOptions<T>): XRef<T | undefined> {
    const reference = ref<T | undefined>() as XRef<T | undefined>;

    Object.defineProperties(reference, {
        error: {
            get: () => ref<unknown>(),
            enumerable: true,
        },
        status: {
            get: () => ref<XRefStatus>(XRefStatus.EMPTY),
            enumerable: true,
        },
        options: {
            get: () => options,
            enumerable: true,
        },
        reload: {
            value: (value?: XRefValue<T>) => {
                resolve(value || options.loader, reference, options)
                return reference
            },
            enumerable: true,
        }
    })

    if (options.initializer) {
        resolve(options.initializer, reference, options)
    } else if (options.loader) {
        resolve(options.loader, reference, options);
    }

    (options.parameter || []).forEach((inputRef: Ref<unknown>) => {
        watch(inputRef, (newValue: unknown, oldValue: unknown) => {
            if (newValue !== oldValue) {
                reference.reload()
            }
        })
    })
    return reference
}

async function resolve<T>(value: XRefValue<T>, reference: XRef<T | undefined>, options: XRefOptions<T>) {
    const request: XRefRequest = {
        parameter: options.parameter,
        abortSignal: new AbortController().signal
    }
    reference.status.value = XRefStatus.LOADING
    try {
        const resolved = await Promise.resolve(typeof value === 'function' ? (value as (request: XRefRequest) => Promise<T> | T | undefined)(request) : value as Promise<T> | T | undefined)
        reference.value = resolved
        reference.status.value = resolved === undefined || resolved === null ? XRefStatus.EMPTY : XRefStatus.RESOLVED
    } catch (error: unknown) {
        reference.error.value = error
        reference.status.value = XRefStatus.ERROR
    }
}