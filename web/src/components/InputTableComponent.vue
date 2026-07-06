<template>
    <div class="input-table" :style="columns">
        <div class="input-table__header">
            <div v-for="header in props.header">{{ header }}</div>
        </div>
        <slot></slot>
    </div>
</template>

<style scoped>

.input-table {
    display: grid;
    grid-template-columns: auto;
    gap: var(--theme-border-width);
    background: var(--theme-element-primary-color);
    padding: var(--theme-border-width);
    border-radius: var(--theme-border-radius);
    margin-bottom: var(--theme-element-spacing);

    & .input-table__header {
        display: contents;
        background: var(--theme-element-primary-color);

        & > div {
            padding: calc(round(.5em,1px) - var(--theme-border-width));
        }
    }

    & :deep( > div:not(.input-table__header)) {
        display: contents;

        & swd-input {
            background: var(--theme-background-color);
            padding: round(.5em,1px) round(.6em,1px);
            border: none;
            outline: var(--theme-border-width) solid transparent !important;

            & label {
                display: none;
            }

            &:hover {
                outline-color: var(--theme-element-secondary-color) !important;
            }

            &:focus, &:active, &:has(input:focus) {
                outline-color: var(--theme-primary-color) !important;
            }
        }
    }
}

@media only screen and (max-width: 767px) {
    .input-table {
        display: block;
        background: transparent;
        margin-bottom: none;

        & .input-table__header {
            display: none;
        }

        & :deep( > div:not(.input-table__header)) {
            display: grid;
            grid-template-columns: auto;
            gap: var(--theme-border-width);
            background: var(--theme-element-primary-color);
            padding: var(--theme-border-width);
            border-radius: var(--theme-border-radius);
            margin-bottom: var(--theme-element-spacing);

            & swd-input label {
                display: initial;
            }
        }
    }
}

</style>

<script setup lang="ts">
import { computed } from 'vue';


const props = defineProps<{ header: string[], columns?: string }>()
const columns = computed(() => `grid-template-columns: ${props.columns ?? props.header.map(name => name ? 'auto' : 'fit-content(0)').join(' ')};`)

</script>