<template>

  <swd-menu>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/stations">Stations</RouterLink>
    <div class="width-100"></div>
    <RouterLink to="/login" v-if="!user">Login</RouterLink>

    <swd-dropdown v-if="user">
      <a>User</a>
      <swd-dropdown-content>
        <swd-selection>
          <h4>{{ user.name }}<swd-subtitle>{{ user.email }}</swd-subtitle></h4>
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

<script setup lang="ts">
import { inject } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import type { CookieService } from './services/cookies.service';
import type { UserService } from './services/user.service';

const cookieService = inject('cookieService') as CookieService
const userService = inject('userService') as UserService

const user = userService.getUserAsRef()

</script>
