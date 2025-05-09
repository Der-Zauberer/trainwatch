import { isReactive, isRef, reactive, toRaw, watch, type Reactive, type Ref } from "vue";

export type ResourceValue<T, P> = ((parameter: P, abortSignal: AbortSignal) => Promise<T> | T | undefined) | Promise<T> | T | undefined
export type ResourceParameter<P> = Reactive<P> | { [K in keyof P]: Ref<P[K]> | Reactive<P[K]> }

export type UnknownResource = {
    readonly error?: Error
    readonly loading: boolean
    readonly empty: boolean
    readonly status: 'EMPTY' | 'LOADING' | 'RESOLVED' | 'ERROR'
    readonly value?: unknown
}

export type Resource<T, P> = {
    readonly error?: Error
    readonly loading: boolean
    readonly empty: boolean
    readonly status: 'EMPTY' | 'LOADING' | 'RESOLVED' | 'ERROR'
    readonly value?: T
    reload: (value?: ResourceValue<T, P>) => Promise<T>
}

type MutableResource<T, P> = {
    error?: Error
    loading: boolean
    empty: boolean
    status: 'EMPTY' | 'LOADING' | 'RESOLVED' | 'ERROR'
    value?: T
    reload: (value?: ResourceValue<T, P>) => Promise<T>
}

export type ResourceOptions<T, P> = {
    parameter?: ResourceParameter<P>
    initializer?: ResourceValue<T, P>
    loader: ResourceValue<T, P>
}

export function resource<T, P>(options: ResourceOptions<T, P>): Resource<T, P> {
    const resource: Resource<T, P> = reactive({
        error: undefined,
        loading: false,
        empty: true,
        status: 'EMPTY',
        value: undefined,
        reload: async (value) => await resolve(value || options.loader, resource, options, abort)
    })
    
    const abort: { value: AbortController | undefined } = { value: undefined }

    if (options.initializer) {
        resolve(options.initializer, resource, options, abort)
    } else if (options.loader) {
        resolve(options.loader, resource, options, abort)
    }

    if (options.parameter) {
        if (isReactive(options.parameter)) {
            watch(options.parameter, () => resource.reload())
        } else {
            for (const parameter of Object.values(options.parameter)) {
                watch(parameter, () => resource.reload())
            }
        }
    }
    return resource
}

export function unwrapParameters<P>(parameters?: ResourceParameter<P>): P | undefined {
    if (!parameters) return;
    if (isRef(parameters) || isReactive(parameters)) return toRaw(parameters) as P;
    return Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, isRef(value) || isReactive(parameters) ? toRaw(value) : value])) as P;
}

async function resolve<T, P>(value: ResourceValue<T, P>, resource: MutableResource<T, P>, options: ResourceOptions<T, P>, abort: { value?: AbortController }): Promise<T> {
    const parameter = unwrapParameters(options.parameter)
    const newAbort = new AbortController()
    resource.loading = true
    resource.status = 'LOADING'
    let resolved
    try {
        abort.value?.abort()
        resolved = await Promise.resolve(typeof value === 'function' ? (value as (parameter: P, abortSignal: AbortSignal) => Promise<T> | T | undefined)(parameter as unknown as P, newAbort.signal) : value as Promise<T> | T | undefined)
        resource.loading = false
        resource.value = resolved
        resource.error = undefined
        resource.status = resolved === undefined || resolved === null ? 'EMPTY' : 'RESOLVED'
    } catch (error: unknown) {
        resource.loading = false
        resource.value = undefined
        resource.error = error as Error
        resource.status = 'ERROR'
    }
    resource.empty = resource.value === undefined || resolved === null || resolved === '' || (Array.isArray(resolved) && resolved.length === 0)
    abort.value = newAbort
    return resolved as T
}