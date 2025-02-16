<template>
    <div class="header flex width-100">
        <swd-input>
            <input type="text" v-model="search">
            <swd-icon class="search-icon" swd-input-icon></swd-icon>
            <swd-icon class="close-icon" swd-input-reset-icon hidden></swd-icon>
        </swd-input>
        <button @click="emits('add')"><swd-icon class="add-icon"></swd-icon> New</button>
    </div>
    <swd-loading-spinner :loading="props.loading">
        <div class="table" :style="props.columns ? 'grid-template-columns: ' + props.columns : ''">
            <slot></slot>
        </div>
    </swd-loading-spinner>
</template>

<style scoped>

swd-loading-spinner {
    width: 100%;
}

.table {
    display: grid;
    grid-template-columns: max-content auto;
    gap: var(--theme-border-width) 0;
    font-size: 0.8em;
    background-color: var(--theme-element-primary-color);
    border: solid var(--theme-border-width) var(--theme-element-primary-color);
    border-radius: var(--theme-border-radius);
}

.table > * {
    display: contents;
}

.table > *:first-child {
    background-color: var(--theme-element-primary-color);
}

.table > *:first-child > * {
    padding: round(0.2em, 1px) round(0.5em, 1px);
}

.table > *:not(:first-child) > * {
    padding: round(0.5em, 1px);
    background-color: var(--theme-background-color);
}

.table > *:last-child > *:first-child { border-bottom-left-radius: var(--theme-border-radius); }
.table > *:last-child > *:last-child { border-bottom-right-radius: var(--theme-border-radius); }

</style>

<script lang="ts" setup>
const search = defineModel()
const props = defineProps(['loading', 'columns'])
const emits = defineEmits(['add'])
</script>