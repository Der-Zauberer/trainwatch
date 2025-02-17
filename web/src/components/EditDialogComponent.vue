<template>
    <swd-dialog shown v-if="entity.value || entity.loading">
        <swd-card>
            <div class="flex flex-space-between">
                <h4 class="margin-0">{{ entity.value?.name || 'Unnamed' }}</h4>
                <button class="ghost" @click="close()"><swd-icon class="close-icon"></swd-icon></button>
            </div>
            <swd-loading-spinner :loading="entity.loading" class="width-100"></swd-loading-spinner>
            <slot v-if="!entity.loading"></slot>
            <button class="width-100 red-color margin-bottom" v-if="!entity.loading" @click="entity.value ? deleteEntity(entity.value) : ''"><swd-icon class="delete-icon"></swd-icon> Delete</button>
            <div class="flex" v-if="!entity.loading">
                <button class="width-100 red-color" @click="close()">Cancel</button>
                <button class="width-100" @click="entity.value ? saveEntity(entity.value) : ''; close()">Save</button>
            </div>
        </swd-card>
    </swd-dialog>
</template>

<style scoped>
swd-card {
    max-width: 600px;
    max-height: 100vh;
    overflow-y: auto;
}

.scroll {
    overflow-y: auto;
}
</style>

<script setup lang="ts">
import { resource } from '@/core/resource';
import { RecordId, type Surreal } from 'surrealdb';
import { inject, reactive, toRaw, watch } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

type Entity = { id: RecordId<string>, name?: string }

const props = defineProps<{
    record: RecordId<string> | undefined
    edit: Entity | undefined
}>()

const emits = defineEmits<{
    (e: 'update'): void
    (e: 'update:record', entity: RecordId<string> | undefined): void
    (e: 'update:edit', entity: typeof props.edit): void
}>()

const parameter = reactive<{ record: RecordId<string> | undefined }>({ record: undefined })
const entity = resource<Entity, { record: RecordId<string> | undefined }>({
    parameter: parameter,
    loader: (edit) => edit.record ? surrealdb.select<Entity>(edit.record) : undefined
})

watch(() => props.record, (record) => parameter.record = toRaw(record))
watch(() => props.edit, (edit) => entity.reload(edit))
watch(() => parameter.record, (record) => emits('update:record', record))
watch(() => entity.value, (value) => emits('update:edit', value))

function close() {
    parameter.record = undefined
    entity.reload(undefined)
}

async function saveEntity(savebale: Entity) {
    const type = savebale.id.tb
    if (savebale.id.id === '') savebale.id = undefined as unknown as RecordId<string>
    await surrealdb.upsert<Entity>(type, savebale).then(array => array[0])
    emits('update')
}

async function deleteEntity(deletable: Entity) {
    await surrealdb.delete(deletable.id)
    parameter.record = undefined
    await entity.reload(undefined)
    emits('update')
}

</script>