<template>
    <swd-dropdown>
        <swd-input>
            <input id="search-input" v-model="parameter.name" :placeholder="placeholder">
            <input hidden @select="emits('search', (<any>$event.target).value)">
            <swd-icon class="search-icon" swd-input-icon/>
            <swd-icon class="close-icon" swd-input-reset-icon hidden/>
        </swd-input>
        <swd-dropdown-content>
            <swd-selection onfilter="event.preventDefault();">
                <a v-for="result of results.value" :key="result.id.id.toString()" v-bind:value="result.id.id">{{ result.name }}</a>
            </swd-selection>
        </swd-dropdown-content>
    </swd-dropdown>
</template>

<style scoped>
swd-dropdown {
    display: block;
    margin-bottom: var(--theme-element-spacing);
}
</style>
  
<script setup lang="ts">
import { resource } from '@/core/resource';
import type { Entity } from '@/core/types';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { inject, reactive, watch } from 'vue';

const props = defineProps<{ name?: string, placeholder?: string }>()
const emits = defineEmits<{ (e: 'search', value: string): void }>()

const surrealdb = inject('surrealDbService') as SurrealDbService

const parameter = reactive({ name: '' })

const results = resource({
    parameter,
    loader: (parameter) => !parameter.name ? [] : surrealdb.query<Entity<'stop'>[]>('fn::search::search($name)', { name: parameter.name }).then(result => result.flat().splice(0, 20))
})

watch(props, async () => props.name ? parameter.name = props.name : {})
</script>