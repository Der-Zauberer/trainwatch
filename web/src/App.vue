<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <swd-menu>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">Home</RouterLink>
  </swd-menu>
  <RouterView />
</template>
