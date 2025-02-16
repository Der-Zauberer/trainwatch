<template>
    <swd-dropdown>
        <swd-input>
            <label :for="toId(id)"> {{ label }}</label>
            <input :id="toId(id)" readonly :value="(model as object).toString()">
        <swd-icon class="down-icon" swd-input-icon></swd-icon>
        </swd-input>
        <input hidden v-model="model">
        <swd-dropdown-content>
            <swd-selection>
                <slot></slot>
            </swd-selection>
        </swd-dropdown-content>
        </swd-dropdown>
</template>

<script setup lang="ts">
const props = defineProps<{ id?: string, label: string}>()
const model = defineModel()
const toId = (id?: string) => id ? id : 'input-' + props.label.toLocaleLowerCase().replace(/\s+/, '-')
</script>