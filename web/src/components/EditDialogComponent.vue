<template>
    <swd-dialog shown>
        <swd-card>
            <div class="flex flex-space-between">
                <h4 class="margin-0">{{ props.title }}</h4>
                <button class="ghost" @click="emits('cancel')"><swd-icon class="close-icon"></swd-icon></button>
            </div>
            <swd-loading-spinner :loading="loading" class="width-100"></swd-loading-spinner>
            <slot v-if="!loading"></slot>
            <div class="flex" v-if="!loading">
                <button class="width-100 red-color" @click="emits('cancel')">Cancel</button>
                <button class="width-100" @click="emits('save')">Save</button>
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
const props = defineProps(['title', 'loading'])
const emits = defineEmits(['save', 'cancel'])
</script>