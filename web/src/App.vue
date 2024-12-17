<template>
  <swd-menu>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/stations">Stations</RouterLink>
  </swd-menu>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>
