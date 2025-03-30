<template>

  <swd-menu>
    <a class="only-smaller-md" v-if="$route.path.startsWith('/studio')" tabindex="0" onclick="swd.query('swd-navigation').toggle()"><swd-icon class="hamburger-icon"></swd-icon></a>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">{{ $t('page.home') }}</RouterLink>
    <RouterLink to="/stop/singen_hohentwiel">{{ $t('entity.stop.stop', 0) }}</RouterLink>
    <div class="width-100"></div>
    <RouterLink to="/login" v-if="!user">{{ $t('page.login') }}</RouterLink>

    <swd-dropdown v-if="user">
      <a>{{ user.name }}</a>
      <swd-dropdown-content>
        <swd-selection>
          <div>
            <span>{{ user.name }}</span>
            <swd-subtitle>{{ user.email }}</swd-subtitle>
          </div>
          <a>Account</a>
          <RouterLink to="/studio">{{ $t('page.studio') }}</RouterLink>
          <a @click="cookieService.logoutAndRedirect()">{{ $t('page.logout') }}</a>
        </swd-selection>
      </swd-dropdown-content>
    </swd-dropdown>

  </swd-menu>

  <swd-navigation navigation-collapse-md v-if="$route.path.startsWith('/studio')">
    <RouterLink to="/studio">{{ $t('page.dashboard') }}</RouterLink>
    <RouterLink to="/studio/stop">{{ $t('entity.stop.stop', 0) }}</RouterLink>
    <RouterLink to="/studio/operator">{{ $t('entity.operator.operator', 0) }}</RouterLink>
    <RouterLink to="/studio/type">{{ $t('entity.type.type', 0) }}</RouterLink>
    <RouterLink to="/studio/route">{{ $t('entity.route.route', 0) }}</RouterLink>
    <RouterLink to="/studio/line">{{ $t('entity.line.line', 0) }}</RouterLink>
    <RouterLink to="/studio/journey">{{ $t('entity.journey.journey', 0) }}</RouterLink>
    <RouterLink to="/studio/role">{{ $t('entity.role.role', 0) }}</RouterLink>
    <RouterLink to="/studio/user">{{ $t('entity.user.user', 0) }}</RouterLink>
  </swd-navigation>

  <swd-navigation-content navigation-collapse-md :style="$route.path.startsWith('/studio') ? '' : 'margin-left: 0'">
    <RouterView/>
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
