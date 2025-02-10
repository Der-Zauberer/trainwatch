<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="roles.loading">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <div v-for="role of roles.value" :key="role.id.id.toString()">
                <div><samp class="id">{{ role.id.id.toString() }}</samp></div>
                <div>{{ role.name }}</div>
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
import type { Role } from '@/core/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const roles = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Role[][]>(`SELECT * FROM role ${ parameter.name ? 'WHERE name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})
</script>