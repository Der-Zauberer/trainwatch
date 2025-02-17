<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="stops.loading">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <div v-for="stop of stops.value" :key="stop.id.id.toString()">
                <div><samp class="id">{{ stop.id.id.toString() }}</samp></div>
                <div>{{ stop.name }}<swd-subtitle>{{ [stop.address.federalState, stop.address.country].join(', ') }}</swd-subtitle></div>
            </div>
        </TableComponent>
    </div>
</template>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Stop } from '@/core/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const stops = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Stop[][]>(`SELECT * FROM stop ${parameter.name ? 'WHERE name CONTAINS $name' : ''} LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})
</script>