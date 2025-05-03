<template>

    <div class="header">
        <div class="header__content">
            <button class="grey-color" @click="events.close()"><swd-icon class="arrow-left-icon"></swd-icon></button>
            <div v-if="name">{{ name }}</div>
        </div>
        <div class="header__actions">
            <swd-loading-spinner :loading="loading.delete">
                <button v-if="id?.id" class="red-color" @click="deleteDialog = true">{{ $t('action.delete') }}</button>
            </swd-loading-spinner>
            <swd-loading-spinner :loading="loading.save">
                <button @click="save()">{{ $t('action.save') }}</button>
            </swd-loading-spinner>
        </div>
    </div>

    <form ref="form">
        <slot></slot>
    </form>

    <swd-dialog v-if="deleteDialog" shown>
        <swd-card>
            <h3>{{ $t('action.delete') }}</h3>

            <p>Do you want to delete the following entry?</p>

            <swd-card class="entity light-color">
                <div><samp class="id">{{ id?.id }}</samp></div>
                <div v-if="name">{{ name }}</div>
            </swd-card>

            <div class="flex" v-if="deleteDialog">
                <button class="grey-color width-100" @click="deleteDialog = false">{{ $t('action.cancel') }}</button>
                <button class="red-color width-100" @click="deleteDialog = false; remove()">{{ $t('action.delete') }}</button>
            </div>
        </swd-card>
    </swd-dialog>

</template>

<style scoped>

.header {
    display: flex;
    align-content: center;
    justify-content: space-between;
    gap: var(--theme-inner-element-spacing);
    width: 100%;
    margin-bottom: var(--theme-element-spacing);
}

.header .header__content, .header .header__actions {
    display: flex;
    align-items: center;
    gap: var(--theme-inner-element-spacing);
}

form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--theme-element-spacing);
}

form > *:is(h1), form > *:is(h2), form > *:is(h3), form > *:is(h4), form > *:is(h5), form > *:is(h6) {
    margin: 0;
    grid-column: span 2;
}

.entity {
    display: flex;
    flex-direction: column;
    gap: 0.5em !important;
    padding: 0.5em;
    background-color: var(--theme-primary-color);
    border-color: var(--theme-primary-color);
}

</style>

<script setup lang="ts">
import type { RecordId } from 'surrealdb';
import { reactive, ref, useTemplateRef } from 'vue';

const props = defineProps<{ id?: RecordId, name?: string, events: { close: () => Promise<unknown>, delete: () => Promise<unknown>, save: () => Promise<unknown> } }>()
    
const deleteDialog = ref(false)
const loading = reactive({ delete: false, save: false })
    
const form = useTemplateRef('form')

async function remove() {
    loading.delete = true
    try {
        await props.events.delete()
        await props.events.close()
    } catch {}
    loading.delete = false
}

async function save() {
    if ((form.value as HTMLFormElement).checkValidity()) {
        loading.save = true
        try {
            await props.events.save()
            await props.events.close()
        } catch {}
        loading.save = false
    } else {
        (form.value as HTMLFormElement).reportValidity()
    }
}

</script>