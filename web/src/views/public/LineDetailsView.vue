<template>
    
    <div class="container-md">
        <LineComponent v-if="line.value" :line="line.value"/>
    </div>

</template>

<script setup lang="ts">
import LineComponent from '@/components/LineComponent.vue';
import { resource } from '@/core/resource';
import type { LineStops } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const surrealdb = inject('surrealdb') as Surreal

const line = resource({
    parameter: route,
    loader: (parameter) => surrealdb.query<LineStops[]>('fn::line::stops($id)', { id: new RecordId('line', parameter.params.id) }).then(results => results[0])
})

</script>