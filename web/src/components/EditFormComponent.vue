<template>

     <div class="container-xl header">
        <button class="grey-color" @click="actions.close()"><swd-icon class="arrow-left-icon"></swd-icon></button>
        <div class="header__title">{{ props.value.name }}</div>
        <swd-loading-spinner :loading="loading.delete">
            <button v-if="props.value.id?.id" class="red-color" @click="deleteDialog = true">{{ $t('action.delete') }}</button>
        </swd-loading-spinner>
        <swd-loading-spinner :loading="loading.save">
            <button @click="save()">{{ $t('action.save') }}</button>
        </swd-loading-spinner>
    </div>
    <hr>

    <form class="container-xl" ref="form">
        <swd-card class="red-color" v-if="error">
            {{ error }}
        </swd-card>
        <slot></slot>
    </form>

    <swd-dialog v-if="deleteDialog" shown>
        <swd-card>
            <h3>{{ $t('action.delete') }}</h3>

            <p>Do you want to delete the following entry?</p>

            <swd-card class="entity light-color">
                <div><samp class="id">{{ props.value.id?.id }}</samp></div>
                <div v-if="props.value.name">{{ props.value.name }}</div>
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
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: var(--theme-inner-element-spacing);
    padding-top: var(--theme-inner-element-spacing);
    padding-bottom: var(--theme-inner-element-spacing);
    margin-bottom: 0;
}

.header .header__title {
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

hr {
    border: none;
    border-bottom: solid var(--theme-border-width) var(--theme-element-primary-color);
    margin: 0;
}

.entity {
    display: flex;
    flex-direction: column;
    gap: 0.5em !important;
    padding: 0.5em;
    background-color: var(--theme-primary-color);
    border-color: var(--theme-primary-color);
}

swd-loading-spinner::after {
    background: white !important;
}

</style>

<script setup lang="ts">
import  { RecordId, SurrealDbError } from 'surrealdb';
import { reactive, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()

const props = defineProps<{ type: string, value: { id?: RecordId<string>, name?: string }, actions: EditActions }>()

const formRef = useTemplateRef('form')

const loading = reactive({ delete: false, save: false })
const error = ref<string>()
const deleteDialog = ref(false)

async function remove() {
    loading.delete = true
    try {
        await props.actions.delete(new RecordId(props.type, route.params.id))
        await props.actions.close()
    } catch (exception: unknown) {
        error.value = (exception as SurrealDbError).message
    }
    loading.delete = false
}

async function save() {
    const form = formRef.value
    if (!form) return
    if (!form.checkValidity()) {
        form.reportValidity()
        return
    }
    loading.save = true
    try {
        await props.actions.save(route.params.id === 'new' ? undefined : new RecordId(props.type, route.params.id))
        await props.actions.close()
    } catch (exception: unknown) {
        error.value = (exception as SurrealDbError).message
    }
    loading.save = false
}

export type EditActions = {
    save: (id: RecordId | undefined) => Promise<unknown>
    delete: (id: RecordId) => Promise<unknown>
    close: () => Promise<unknown>
}

</script>