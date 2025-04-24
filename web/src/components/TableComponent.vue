<template>

    <swd-card v-if="resource.error" class="red-color">
        {{ resource.error }}
    </swd-card>

    <div v-if="!resource.error">
        
        <div class="header">
            <swd-input>
                <input type="text" :placeholder="$t('action.search')" v-model="parameter.search" @input="parameter.page = 1" ref="searchInput">
                <swd-icon class="search-icon" swd-input-icon></swd-icon>
                <swd-icon class="close-icon" swd-input-reset-icon hidden></swd-icon>
            </swd-input>
            <button class="header--action" @click="emits('add')"><swd-icon class="add-icon"></swd-icon> {{ $t('action.new') }}</button>
        </div>

        <div v-if="resource.loading || !resource.empty" class="table" :class="resource.loading ? 'table--loading' : undefined" :style="`grid-template-columns: repeat(${header.length - 1}, minmax(80px, max-content)) auto`">
            <div><div v-for="headline of header" :key="headline">{{ headline }}</div></div>
            <slot v-if="!resource.loading"></slot>
            <div v-if="resource.loading"><div v-for="headline of header" :key="headline"><swd-skeleton-text></swd-skeleton-text></div></div>
            <div v-if="resource.loading"><div v-for="headline of header" :key="headline"><swd-skeleton-text></swd-skeleton-text></div></div>
            <div v-if="resource.loading"><div v-for="headline of header" :key="headline"><swd-skeleton-text></swd-skeleton-text></div></div>
            <div v-if="resource.loading"><div v-for="headline of header" :key="headline"><swd-skeleton-text></swd-skeleton-text></div></div>
            <div v-if="resource.loading"><div v-for="headline of header" :key="headline"><swd-skeleton-text></swd-skeleton-text></div></div>
        </div>

        <div class="pager" v-if="parameter.count > parameter.size">
            <button v-if="parameter.page > 1" @click="parameter.page--"><swd-icon class="left-icon"></swd-icon></button>
            <button v-if="parameter.page > 1" @click="parameter.page = 1">1</button>
            <button selected>{{ parameter.page }}</button>
            <button v-if="parameter.page < maxPage()" @click="parameter.page = maxPage()">{{ maxPage() }}</button>
            <button v-if="parameter.page < maxPage()" @click="parameter.page++"><swd-icon class="right-icon"></swd-icon></button>
        </div>

        <swd-card-outline v-if="!resource.loading && resource.empty" class="empty">
            <h4>{{ $t('status.empty.title') }}</h4>
            <p>{{ $t('status.empty.description') }}</p>
            <div class="flex">
                <button v-if="parameter.search" class="outline grey-color" @click="resetSearch()"><swd-icon class="delete-icon"></swd-icon> {{ $t('action.resetSearch') }}</button>
                <button @click="emits('add')"><swd-icon class="add-icon"></swd-icon> {{ $t('action.create') }}</button>
            </div>
        </swd-card-outline>
        
    </div>

</template>

<style scoped>

.header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--theme-inner-element-spacing);
    margin-bottom: var(--theme-inner-element-spacing);
    width: 100%;
}

.header .header--action {
    margin-left: auto
}

.pager {
    display: flex;
    justify-content: end;
}

.pager > button:not(:first-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.pager > button:not(:last-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.empty {
    display: flex;
    flex-direction: column;
}

.empty > * {
    display: flex;
    width: fit-content;
    text-align: center;
    margin: 0 auto;
}

.table {
    display: grid;
    grid-template-columns: max-content auto;
    gap: var(--theme-border-width) 0;
    font-size: 0.8em;
    background-color: var(--theme-element-primary-color);
    border: solid var(--theme-border-width) var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);
    margin-bottom: var(--theme-element-spacing);
}

.table--loading {
    cursor: wait;
}

.table > * {
    display: contents;
    color: unset;
    text-decoration: none;
}

.table > *:first-child {
    background-color: var(--theme-element-primary-color);
}

.table > *:first-child > * {
    padding: round(0.2em, 1px) round(0.5em, 1px);
}

.table > *:not(:first-child) > * {
    padding: round(0.5em, 1px);
    background: var(--theme-background-color);   
}

.table:not(.table--loading) > *:not(:first-child):hover, .table:not(.table--loading) > *:not(:first-child):hover > * {
    background: var(--theme-element-primary-color);
    cursor: pointer;
}

.table > *:last-child > *:first-child { border-bottom-left-radius: var(--theme-border-radius) }
.table > *:last-child > *:last-child { border-bottom-right-radius: var(--theme-border-radius) }

@media only screen and (max-width: 575px) {

    .table {
        display: flex;
        flex-direction: column;
    }

    .table > * {
        display: flex;
        flex-direction: column;
        gap: var(--theme-border-width);
        padding: round(0.5em, 1px);
        background: var(--theme-background-color);
    }

    .table > *:not(:first-child) > * { padding: initial }
    .table > *:first-child { display: none }

    .table > *:nth-child(2) { border-top-left-radius: var(--theme-border-radius); border-top-right-radius: var(--theme-border-radius); }
    .table > *:last-child { border-bottom-left-radius: var(--theme-border-radius); border-bottom-right-radius: var(--theme-border-radius); }

}
</style>

<script lang="ts" setup>
import type { UnknownResource } from '@/core/resource';
import type { Parameter } from '@/core/types';
import { useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter()
const route = useRoute()
const parameter = defineModel<Parameter>({ required: true })
const searchInput = useTemplateRef('searchInput')

defineProps<{
    resource: UnknownResource,
    header: string[]
}>()

const emits = defineEmits<{
    (e: 'add'): void
}>()

if (route.query.search && route.query.search !== parameter.value.search) {
    parameter.value.search = route.query.search as string
}
if (route.query.page && Number(route.query.page) !== parameter.value.page) {
    parameter.value.page = Number(route.query.page)
}

watch(parameter.value, () => {
    refreshQueryParameter('search', parameter.value.search, '')
    refreshQueryParameter('page', parameter.value.page, 1)
})

function resetSearch() {
    if (searchInput.value) {
        searchInput.value.value = ''
        searchInput.value.dispatchEvent(new Event('input', { bubbles: true }))
    }
    parameter.value.search = ''
}

function maxPage() {
    return Math.floor(parameter.value.count / parameter.value.size) + 1
}

function refreshQueryParameter<T extends string | number>(name: string, value: T, initial: T) {
    if (value !== initial) {
        router.push({ query: { ...route.query, [name]: value }})
    } else {
        router.replace({ query: Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== name)) })
    }
}

</script>