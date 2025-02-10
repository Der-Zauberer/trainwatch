<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="operators.loading">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <div v-for="operator of operators.value" :key="operator.id.id.toString()">
                <div><samp class="id">{{ operator.id.id.toString() }}</samp></div>
                <div>{{ operator.name }}<swd-subtitle>{{ [operator.address.federalState, operator.address.country].join(', ') }}</swd-subtitle></div>
            </div>
        </TableComponent>
    </div>
</template>

<style scoped>

.id {
    color: hsl(225, 100%, 50%);
    background-color: hsla(225, 100%, 50%, 30%);
}

</style>

<script setup lang="ts">
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Operator } from '@/core/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const operators = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Operator[][]>(`SELECT * FROM operator ${ parameter.name ? 'WHERE name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})
</script>