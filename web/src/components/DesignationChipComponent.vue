<template>
    <swd-chip :style="`background: ${type.color.background}; color: ${type.color.text};`">{{ [type.name, number].join(' ') }}</swd-chip>
</template>

<script setup lang="ts">
import type { Type } from '@/core/types';
defineProps<{ type: Type, number?: string }>()
</script>