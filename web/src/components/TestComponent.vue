<template>
  <swd-card> {{ designation }} {{ destination }} </swd-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const designation = ref('ICE 512')
const destination = ref('Singen (Hohentwiel)')

</script>
