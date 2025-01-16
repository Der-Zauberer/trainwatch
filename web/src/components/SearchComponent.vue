<template>
    <swd-dropdown>
        <swd-input>
            <input id="search-input" v-model="parameter.name">
            <input hidden @select="select((<any>$event.target).value)">
            <swd-icon class="search" onclick="this.parentElement.querySelector('input').focus()"/>
        </swd-input>
        <swd-dropdown-content>
            <swd-selection onfilter="event.preventDefault();">
                <a v-for="result of results" :key="result.id.id.toString()" v-bind:value="result.id.id">{{ result.name }}</a>
            </swd-selection>
        </swd-dropdown-content>
    </swd-dropdown>
</template>

<style scoped>
swd-dropdown {
    display: block;
    margin-bottom: var(--theme-element-spacing);
}
</style>
  
<script setup lang="ts">
import type { Search } from '@/types';
import { xref } from '@/xref';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const emit = defineEmits(['search'])

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const results = xref({
    parameter,
    loader: (parameter) => !parameter.name ? [] : surrealdb.query<Search[]>('fn::search::search($name)', { name: parameter.name }).then(result => result.flat())
})

const select = (value: string) => {
    emit('search', value)
}
</script>