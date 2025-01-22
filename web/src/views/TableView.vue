<template>
    
    <div class="container-xl">

        <swd-input class="margin-bottom">
            <input type="text" v-model="parameter.name">
        </swd-input>

        <div class="table">
            <div class="table__header">
                <div>Id</div>
                <div>Name</div>
            </div>
            <div class="table__row" v-for="stop of stops.value" :key="stop.name">
                <div><samp class="id">{{ stop.id.id.toString() }}</samp></div>
                <div>{{ stop.name }}</div>
            </div>
        </div>

    </div>

</template>

<style scoped>

.table {
    display: grid;
    grid-template-columns: fit-content(0) auto;
    gap: var(--theme-border-width);
    background-color: var(--theme-primary-grey-color);
    border: solid var(--theme-border-width) var(--theme-primary-grey-color);
    border-radius: var(--theme-border-radius);
}

.table .table__header, .table .table__row {
    display: contents;
}

.table .table__header > *, .table .table__row > * {
    padding: round(0.2em, 1px) round(0.5em, 1px);
}

.table .table__row:last-child > *:first-child {
    border-bottom-left-radius: var(--theme-border-radius);
}

.table .table__row:last-child > *:last-child {
    border-bottom-right-radius: var(--theme-border-radius);
}

.table .table__row > * {
    padding: round(0.5em, 1px);
    background-color: var(--theme-background-color);
}

.id {
    color: hsl(225, 100%, 50%);
    background-color: hsla(225, 100%, 50%, 20%);
}

</style>

<script setup lang="ts">
import { resource } from '@/resource';
import type { Stop } from '@/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: 'Singen ' })

const stops = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Stop[][]>(!parameter.name ? 'SELECT * FROM stop LIMIT 1000' : 'SELECT * FROM stop WHERE name CONTAINS $name LIMIT 1000', parameter).then(response => response[0].slice(0, 100))
})
</script>