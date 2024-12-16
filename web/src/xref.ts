import { ref, watch, type Ref } from "vue";

export type XRefValue<T, P> = ((parameter: P, abortSignal: AbortSignal) => Promise<T> | T | undefined) | Promise<T> | T | undefined
export type XOptionParameter = { [key: string]: Ref<unknown | undefined> } | {}

export type XRef<T, P extends XOptionParameter> = Ref<T> & {
    readonly error: Ref<unknown | undefined>
    readonly loading: Ref<boolean>
    readonly empty: Ref<boolean>
    readonly status: Ref<XRefStatus>
    reload: (value?: XRefValue<T, P>) => XRef<T, P>
}

export type XRefOptions<T, P> = {
    parameter?: P
    initializer?: XRefValue<T, P>
    loader: XRefValue<T, P>
}

export enum XRefStatus { EMPTY, LOADING, RESOLVED, ERROR }

export function xref<T, P extends XOptionParameter>(options: XRefOptions<T, P>): XRef<T | undefined, P> {
    const reference = ref<T | undefined>() as XRef<T | undefined, P>;
    const abort: { value: AbortController | undefined } = { value: undefined }

    Object.defineProperties(reference, {
        error: {
            get: () => ref<unknown>(),
            enumerable: true,
        },
        laoding: {
            get: () => reference.status.value === XRefStatus.LOADING,
            enumerable: true,
        },
        empty: {
            get: () => reference.status.value === XRefStatus.EMPTY,
            enumerable: true,
        },
        status: {
            get: () => ref<XRefStatus>(XRefStatus.EMPTY),
            enumerable: true,
        },
        reload: {
            value: (value?: XRefValue<T, P>) => {
                resolve(value || options.loader, reference, options, abort)
                return reference
            },
            enumerable: true,
        }
    })

    if (options.initializer) {
        resolve(options.initializer, reference, options, abort)
    } else if (options.loader) {
        resolve(options.loader, reference, options, abort);
    }

    if (options.parameter) {
        Object.values(options.parameter).forEach((inputRef: Ref<unknown | undefined>) => {
            watch(inputRef, (newValue: unknown, oldValue: unknown) => {
                if (newValue !== oldValue) {
                    reference.reload()
                }
            })
        })
    }
    return reference
}

async function resolve<T, P extends XOptionParameter>(value: XRefValue<T, P>, reference: XRef<T | undefined, P>, options: XRefOptions<T, P>, abort: { value: AbortController | undefined }) {
    const newAbort = new AbortController()
    reference.status.value = XRefStatus.LOADING
    try {
        abort.value?.abort()
        const resolved = await Promise.resolve(typeof value === 'function' ? (value as (parameter: P, abortSignal: AbortSignal) => Promise<T> | T | undefined)(options.parameter as unknown as P, newAbort.signal) : value as Promise<T> | T | undefined)
        reference.value = resolved
        reference.status.value = resolved === undefined || resolved === null ? XRefStatus.EMPTY : XRefStatus.RESOLVED
    } catch (error: unknown) {
        reference.error.value = error
        reference.status.value = XRefStatus.ERROR
    }
    abort.value = newAbort
    return abort;
}