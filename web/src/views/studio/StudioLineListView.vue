<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="lines.loading">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <div v-for="line of lines.value" :key="line.id.id.toString()">
                <div><samp class="id">{{ line.id.id.toString() }}</samp></div>
                <div class="flex">
                    <span>
                        <swd-chip v-for="designation of line.route.designations" :key="designation.number" :style="`color: ${designation.type.color.text}; background-color: ${designation.type.color.background};`">
                            {{ designation.type.name }} {{ designation.number }}
                        </swd-chip>
                    </span>
                    {{ line.route.name }}
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
</style>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Line } from '@/core/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const lines = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Line[][]>(`SELECT *, route.*, route.designations.{type.*, number} FROM line ${ parameter.name ? 'WHERE route.name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})
</script>