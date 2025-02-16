<template>
    <swd-input>
        <label :for="toId(id)">{{ label }}</label>
        <input :id="toId(id)" v-model="model" :type="type" :disabled="disabled">
    </swd-input>
</template>

<script setup lang="ts">
const props = defineProps<{ id?: string, label: string, type?: string, disabled?: boolean }>()
const model = defineModel()
const toId = (id?: string) => id ? id : 'input-' + props.label.toLocaleLowerCase().replace(/\s+/, '-')
</script>