<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="users.loading">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <div v-for="user of users.value" :key="user.id.id.toString()">
                <div><samp class="id">{{ user.id.id.toString() }}</samp></div>
                <div>{{ user.name }}<swd-subtitle>{{ user.email }}</swd-subtitle></div>
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
import type { User } from '@/core/types';
import type Surreal from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })

const users = resource({
    parameter,
	loader: (parameter) => surrealdb.query<User[][]>(`SELECT * FROM user ${ parameter.name ? 'WHERE (name CONTAINS $name || email CONTAINS $name)' : '' } LIMIT 1000`).then(response => response[0].slice(0, 100))
})
</script>