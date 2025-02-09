<template>
  <swd-menu>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/stations">Stations</RouterLink>
    <div class="width-100"></div>
    <RouterLink to="/login" v-if="!authenticated">Login</RouterLink>
    <a @click="cookieService.logoutAndRedirect()" v-if="authenticated">Logout</a>
  </swd-menu>
  <swd-navigation v-if="$route.path.startsWith('/studio')">
    <RouterLink to="/studio">Dashboard</RouterLink>
    <RouterLink to="/studio/stop">Stops</RouterLink>
    <RouterLink to="/studio/operator">Operators</RouterLink>
    <RouterLink to="/studio/type">Types</RouterLink>
    <RouterLink to="/studio/role">Roles</RouterLink>
    <RouterLink to="/studio/user">Users</RouterLink>
  </swd-navigation>
  <swd-navigation-content :style="$route.path.startsWith('/studio') ? '' : 'margin-left: 0'">
    <RouterView />
  </swd-navigation-content>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import type { CookieService } from './services/cookies.service';

const cookieService = inject('cookies') as CookieService
const authenticated = cookieService.isAuthenticatedAsRef()

</script>
