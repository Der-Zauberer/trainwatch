<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="types.loading" columns="max-content max-content auto">
            <div>
                <div>Id</div>
                <div>Name</div>
                <div>Description</div>
            </div>
            <div v-for="type of types.value" :key="type.id.id.toString()">
                <div><samp class="id">{{ type.id.id.toString() }}</samp></div>
                <div><swd-chip :style="`color: ${type.color.text}; background-color: ${type.color.background};`">{{ type.name }}</swd-chip></div>
                <div>{{ type.description }}</div>
            </div>
        </TableComponent>
    </div>
</template>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Type } from '@/core/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const types = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Type[][]>(`SELECT * FROM type ${ parameter.name ? 'WHERE name CONTAINS $name' : ''} ORDER BY priority LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})
</script>