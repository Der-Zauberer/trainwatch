<template>
  <swd-menu>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/stations">Stations</RouterLink>
    <div class="width-100"></div>
    <RouterLink to="/login" v-if="!authenticated">Login</RouterLink>
    <a @click="cookieService.logoutAndRedirect()" v-if="authenticated">Logout</a>
  </swd-menu>
  <RouterView />
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import type { CookieService } from './services/cookies.service';

const cookieService = inject('cookies') as CookieService
const authenticated = cookieService.isAuthenticatedAsRef()

</script>
