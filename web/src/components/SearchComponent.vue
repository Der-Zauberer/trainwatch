<template>
    <swd-dropdown>
        <swd-input>
            <input id="search-input" v-model="parameter.name">
            <input hidden @select="select((<any>$event.target).value)">
            <swd-icon class="search-icon" swd-input-icon/>
            <swd-icon class="close-icon" swd-input-reset-icon hidden/>
        </swd-input>
        <swd-dropdown-content>
            <swd-selection onfilter="event.preventDefault();">
                <a v-for="result of results.value" :key="result.id.id.toString()" v-bind:value="result.id.id">{{ result.name }}</a>
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
import { resource } from '@/resource';
import type { Search } from '@/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const emit = defineEmits(['search'])

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const results = resource({
    parameter,
    loader: (parameter) => !parameter.name ? [] : surrealdb.query<Search[]>('fn::search::search($name)', { name: parameter.name }).then(result => result.flat().splice(0, 20))
})

const select = (value: string) => {
    emit('search', value)
}
</script>