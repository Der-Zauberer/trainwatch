import { reactive, watch, type Reactive } from "vue";

export type ResourceValue<T, P extends Reactive<unknown>> = ((parameter: P, abortSignal: AbortSignal) => Promise<T> | T | undefined) | Promise<T> | T | undefined

export type MutableResource<T, P extends Reactive<unknown>> = {
    error: unknown | undefined
    loading: boolean
    empty: boolean
    status: ResourceStatus
    value: T | undefined
    reload: (value?: ResourceValue<T, P>) => Promise<T>
}

export type Resource<T, P extends Reactive<unknown>> = {
    readonly error: unknown | undefined
    readonly loading: boolean
    readonly empty: boolean
    readonly status: ResourceStatus
    value: T | undefined
    reload: (value?: ResourceValue<T, P>) => Promise<T>
}

export type ResourceOptions<T, P extends Reactive<unknown>> = {
    parameter?: P
    initializer?: ResourceValue<T, P>
    loader: ResourceValue<T, P>
}

export enum ResourceStatus { EMPTY, LOADING, RESOLVED, ERROR }

export function resource<T, P extends Reactive<unknown>>(options: ResourceOptions<T, P>): Resource<T, P> {
    const resource: Resource<T, P> = reactive({
        error: undefined,
        loading: false,
        empty: true,
        status: ResourceStatus.EMPTY,
        value: undefined,
        reload: async (value) => await resolve(value || options.loader, resource, options, abort)
    })
    
    const abort: { value: AbortController | undefined } = { value: undefined }

    if (options.initializer) {
        resolve(options.initializer, resource, options, abort)
    } else if (options.loader) {
        resolve(options.loader, resource, options, abort);
    }

    if (options.parameter) {
        watch(options.parameter, () => resource.reload())
    }
    return resource
}

async function resolve<T, P extends Reactive<unknown>>(value: ResourceValue<T, P>, resource: MutableResource<T, P>, options: ResourceOptions<T, P>, abort: { value: AbortController | undefined }): Promise<T> {
    const newAbort = new AbortController()
    resource.loading = true
    resource.status = ResourceStatus.LOADING
    let resolved
    try {
        abort.value?.abort()
        resolved = await Promise.resolve(typeof value === 'function' ? (value as (parameter: P, abortSignal: AbortSignal) => Promise<T> | T | undefined)(options.parameter as unknown as P, newAbort.signal) : value as Promise<T> | T | undefined)
        resource.loading = false
        resource.value = resolved
        resource.error = undefined
        resource.status = resolved === undefined || resolved === null ? ResourceStatus.EMPTY : ResourceStatus.RESOLVED
    } catch (error: unknown) {
        resource.loading = false
        resource.value = undefined
        resource.error = error
        resource.status = ResourceStatus.ERROR
    }
    resource.empty = resource.value === undefined ||  resolved === null
    abort.value = newAbort
    return resolved as T
}