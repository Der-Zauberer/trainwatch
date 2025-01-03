<template>
    <div class="container-md">
        <p>Hello World!</p>
        <TestComponent/>
        <DirectionComponent/>
        <JourneyComponent/>
    </div>
</template>

<script setup lang="ts">
import DirectionComponent from '@/components/DirectionComponent.vue';
import JourneyComponent from '@/components/JourneyComponent.vue';
import TestComponent from '@/components/TestComponent.vue';
</script>
