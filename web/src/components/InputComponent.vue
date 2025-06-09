<template>
    <swd-input>
        <label :for="toId(id)" v-if="label">{{ label }}</label>
        <input :id="toId(id)" v-model="model" :type="type" :step="step" :disabled="disabled" :required="required" :readonly="readonly">
    </swd-input>
</template>

<script setup lang="ts">
const props = defineProps<{ 
    id?: string,
    label?: string,
    type?: string,
    step?: string
    disabled?: boolean,
    required?: boolean,
    readonly?: boolean
}>()

const model = defineModel()
const toId = (id?: string) => id ? id : 'input-' + props?.label?.toLocaleLowerCase()?.replace(/\s+/, '-')
</script>