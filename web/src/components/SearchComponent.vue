<template>
    <swd-dropdown>
        <input id="search-input" @input="name = (<any>$event.target).value">
        <input hidden @select="select((<any>$event.target).value)">
        <swd-icon class="search" onclick="this.parentElement.querySelector('input').focus()"></swd-icon>
        <swd-dropdown-content>
            <swd-selection onfilter="event.preventDefault();">
                <a v-for="result of results" :key="result.id.id.toString()" v-bind:value="result.id.id">{{ result.name }}</a>
            </swd-selection>
        </swd-dropdown-content>
    </swd-dropdown>
</template>
  
<script setup lang="ts">
import type { Search } from '@/types';
import { xref } from '@/xref';
import type Surreal from 'surrealdb';
import { inject, ref } from 'vue';

const emit = defineEmits(['search'])

const surrealdb = inject('surrealdb') as Surreal
const name = ref('')

const results = xref({
    parameter: { name },
    loader: (parameter) => !name.value ? [] : surrealdb.query<Search[]>('fn::search::search($name)', { name: parameter.name.value }).then(result => result.flat())
})

const select = (value: string) => {
    emit('search', value)
}
</script>