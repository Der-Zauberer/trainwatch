<template>
    <swd-dropdown>
        <div class="input-bar">
            <swd-input @click="focusSearch()" class="dropdown-input" :class="to ? 'left-item' : ''">
                <label :for="toId(id)"> {{ label }}</label>
                <span>{{ (record.value || model || '').toString() }}</span>
                <swd-icon :class="record.loading ? 'loading-spinner-icon' : 'down-icon'" swd-input-icon></swd-icon>
            </swd-input>
            <input hidden @input="console.log(toRaw(records.value?.find(record => record.id.toString() === ($event.target as HTMLInputElement).value)?.id)); model = records.value?.find(record => record.id.toString() === ($event.target as HTMLInputElement).value)?.id as unknown as RecordId; parameter.search = '';">
            <RouterLink v-if="to" :to="to" class="button right-item grey-color input-bar__link"><swd-icon class="external-icon"></swd-icon></RouterLink>
        </div>
        <swd-dropdown-content class="dropdown-content">
            <swd-input class="dropdown-content__search center-item">
                <input :placeholder="$t('action.search')" v-model="parameter.search" ref="search">
            </swd-input>
            <swd-loading-spinner :loading="records.loading">
                <swd-selection class="bottom-item" @filter.prevent>
                    <a v-for="record of records.value" :key="record.id.toString()" :value="record.id.toString()" @click="model = record.id">
                        {{ record.name }} 
                        <swd-subtitle>{{ record.id.toString() }}</swd-subtitle>
                    </a>
                    <div v-if="records.empty" style="height: 60px;"></div>
                </swd-selection>
            </swd-loading-spinner>
        </swd-dropdown-content>
    </swd-dropdown>
</template>

<style scoped>

.input-bar {
    display: grid;
    grid-template-columns: auto fit-content(0);
}

.input-bar .input-bar__link {
    display: flex;
    align-items: center;
    background: var(--theme-element-secondary-color);
    height: round(3.2em, 1px);
}

.input-bar .input-bar__link swd-icon {
    transform: translateY(0);
}

.dropdown-input  {
    cursor: pointer;
}

.dropdown-content {
    box-sizing: border-box;
    border: solid var(--theme-border-width) var(--theme-element-secondary-color);
    border-radius: var(--theme-border-radius);
}

.dropdown-content .dropdown-content__search {
    position: sticky;
    top: 0;
}

swd-loading-spinner {
    width: 100%;
}

</style>

<script setup lang="ts">
import { resource } from '@/core/resource';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { surql, type RecordId } from 'surrealdb';
import { inject, reactive, toRaw, useTemplateRef } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

const surrealdb = inject('surrealDbService') as SurrealDbService

const props = defineProps<{ id?: string, label: string, type: string, required: boolean, to?: RouteLocationRaw}>()
const model = defineModel<RecordId>()

const search = useTemplateRef('search')

const focusSearch = () => setTimeout(() => search?.value?.focus(), 0)

const toId = (id?: string) => id ? id : 'input-' + props.label.toLocaleLowerCase().replace(/\s+/, '-')

const parameter = reactive({ search: '' })

const records = resource({
    parameter,
    loader: (parameter) => surrealdb.query<{ id: RecordId, name: string }[][]>(`SELECT id, name FROM ${props.type} ${ parameter.search ? 'WHERE fn::search::normalize(name) CONTAINS fn::search::normalize($search)' : '' } LIMIT 25;`, parameter).then(result => result[0])
})

const record = resource({
    parameter: { model },
    loader: async (parameter) => await surrealdb.query<[{ name: string }[]]>(surql`SELECT name FROM ${parameter.model.value};`).then(result => result[0][0].name)
})

</script>