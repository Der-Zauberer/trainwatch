<template>
    <swd-chip v-for="designation of designations(type)" :key="[designation.type.name, designation.number].join(' ')" :style="`background: ${designation.type.color.background}; color: ${designation.type.color.text};`">
        {{ [designation.type.name, designation.number].join(' ') }}
    </swd-chip>
</template>

<script setup lang="ts">
import type { Route, Type } from '@/core/types';
defineProps<{ type: Route | Type }>()

function designations(type: Route | Type): { type: Type, number?: string }[] {
    if ('designations' in type) {
        return type.designations;
    } else {
        return [{ type }];
    }
}
</script>