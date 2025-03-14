<template>

  <swd-menu>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/stations">Stations</RouterLink>
    <div class="width-100"></div>
    <RouterLink to="/login" v-if="!user">Login</RouterLink>

    <swd-dropdown v-if="user">
      <a>{{ user.name }}</a>
      <swd-dropdown-content>
        <swd-selection>
          <div>
            <span>{{ user.name }}</span>
            <swd-subtitle>{{ user.email }}</swd-subtitle>
          </div>
          <a>Account</a>
          <RouterLink to="/studio">Studio</RouterLink>
          <a @click="cookieService.logoutAndRedirect()">Logout</a>
        </swd-selection>
      </swd-dropdown-content>
    </swd-dropdown>

  </swd-menu>

  <swd-navigation v-if="$route.path.startsWith('/studio')">
    <RouterLink to="/studio">Dashboard</RouterLink>
    <RouterLink to="/studio/stop">Stops</RouterLink>
    <RouterLink to="/studio/operator">Operators</RouterLink>
    <RouterLink to="/studio/type">Types</RouterLink>
    <RouterLink to="/studio/route">Routes</RouterLink>
    <RouterLink to="/studio/line">Lines</RouterLink>
    <RouterLink to="/studio/journey">Journeys</RouterLink>
    <RouterLink to="/studio/role">Roles</RouterLink>
    <RouterLink to="/studio/user">Users</RouterLink>
  </swd-navigation>

  <swd-navigation-content :style="$route.path.startsWith('/studio') ? '' : 'margin-left: 0'">
    <RouterView />
  </swd-navigation-content>

</template>

<style scoped>

swd-dropdown {
  height: 40px;
}

swd-dropdown swd-selection div {
  padding: round(.5em,1px) round(.6em,1px);
}

</style>

<script setup lang="ts">
import { inject } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import type { CookieService } from './services/cookies.service';

const cookieService = inject('cookieService') as CookieService

const user = cookieService.getUserAsRef()

</script>
