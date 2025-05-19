<template>

    <form @submit.prevent="save($event)">

        <div class="container-xl header">
            <button class="grey-color" @click="emits('close')"><swd-icon class="arrow-left-icon"></swd-icon></button>
            <div class="header__title">{{ props.value.name }}</div>
            <swd-loading-spinner :loading="loading.delete">
                <button v-if="props.value.id?.id" class="red-color" @click="deleteDialog = true">{{ $t('action.delete') }}</button>
            </swd-loading-spinner>
            <swd-loading-spinner :loading="loading.save">
                <input type="submit" :value="$t('action.save')">
            </swd-loading-spinner>
        </div>
        <hr>

        <!--
        <swd-card class="red-color" v-if="error">
            {{ error }}
        </swd-card>
        -->

        <div class="container-xl" >
            <slot></slot>
        </div>

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
import type { Filterable } from '@/core/dtos';
import Surreal, { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const surrealdb = inject('surrealdb') as Surreal

const props = defineProps<{ type: string, value: Filterable<unknown> & { id?: RecordId<string>, name?: string } }>()
const emits = defineEmits<{ (e: 'close'): void }>() 

const deleteDialog = ref(false)
const loading = reactive({ delete: false, save: false })

async function remove() {
    loading.delete = true
    try {
        await surrealdb.delete(new RecordId(props.type, route.params.id))
        emits('close')
    } catch {}
    loading.delete = false
}

async function save(event: Event) {
    const form = event.target as HTMLFormElement
    if (!form.checkValidity()) {
        form.reportValidity()
        return
    }
    loading.save = true
    try {
        if (route.params.id === 'new') {
            await surrealdb.insert(props.value.filterBeforeSubmit())
        } else {
            await surrealdb.upsert(new RecordId(props.type, route.params.id), props.value.filterBeforeSubmit())
        }
        emits('close')
    } catch (error: unknown) {
        console.log(error)
    }
    loading.save = false
}

</script>