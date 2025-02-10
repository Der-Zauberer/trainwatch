<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="routes.loading">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <div v-for="route of routes.value" :key="route.id.id.toString()">
                <div><samp class="id">{{ route.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span>
                        <swd-chip v-for="designation of route.designations" :key="designation.number" :style="`color: ${designation.type.color.text}; background-color: ${designation.type.color.background};`">
                            {{ designation.type.name }} {{ designation.number }}
                        </swd-chip>
                    </span>
                    {{ route.name }}
                </div>
            </div>
        </TableComponent>
    </div>
</template>

<style scoped>

.flex {
    margin: 0;
    --theme-element-spacing: calc(var(--theme-inner-element-spacing) / 2)
}

.id {
    color: hsl(225, 100%, 50%);
    background-color: hsla(225, 100%, 50%, 30%);
}

</style>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Route } from '@/core/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const routes = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Route[][]>(`SELECT *, designations.{type.*, number} FROM route ${ parameter.name ? 'WHERE name CONTAINS $name' : ''} LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})
</script>