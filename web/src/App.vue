<template>

  <swd-menu>
    <a class="only-smaller-md" v-if="$route.path.startsWith('/studio')" tabindex="0" onclick="swd.query('swd-navigation').toggle()"><swd-icon class="hamburger-icon"></swd-icon></a>
    <a class="swd-menu-title">trainwatch</a>
    <RouterLink to="/">{{ $t('page.home') }}</RouterLink>
    <RouterLink :to="{ name: 'stop' }">{{ $t('entity.stop.stop', 0) }}</RouterLink>
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
          <RouterLink to="/profile">{{ $t('page.profile') }}</RouterLink>
          <RouterLink to="/studio">{{ $t('page.studio') }}</RouterLink>
          <a @click="surrealdb.invalidate(); surrealdb.redirectPostInvalidate()">{{ $t('page.logout') }}</a>
        </swd-selection>
      </swd-dropdown-content>
    </swd-dropdown>

  </swd-menu>

  <swd-navigation navigation-collapse-md v-if="$route.path.startsWith('/studio')">
    <RouterLink :to="{ name: 'studio' }" :selected="isRoute(['studio'])">{{ $t('page.dashboard') }}</RouterLink>
    <RouterLink :to="{ name: 'studio_stop' }" :selected="isRoute(['studio_stop', 'studio_stop_edit'])">{{ $t('entity.stop.stop', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_operator' }" :selected="isRoute(['studio_operator', 'studio_operator_edit'])">{{ $t('entity.operator.operator', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_type' }" :selected="isRoute(['studio_type', 'studio_type_edit'])">{{ $t('entity.type.type', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_timetable' }" :selected="isRoute(['studio_timetable', 'studio_timetable_edit'])">{{ $t('entity.timetable.timetable', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_route' }" :selected="isRoute(['studio_route', 'studio_route_edit'])">{{ $t('entity.route.route', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_line' }" :selected="isRoute(['studio_line', 'studio_line_edit'])">{{ $t('entity.line.line', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_journey' }" :selected="isRoute(['studio_journey','studio_journey_edit'])">{{ $t('entity.journey.journey', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_role' }" :selected="isRoute(['studio_role','studio_role_edit'])">{{ $t('entity.role.role', 0) }}</RouterLink>
    <RouterLink :to="{ name: 'studio_user' }" :selected="isRoute(['studio_user', 'studio_user_edit'])">{{ $t('entity.user.user', 0) }}</RouterLink>
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
import { inject, type Ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router'
import type { SurrealDbService } from './services/surrealdb.service';
import type { User } from './core/types';

const route = useRoute()
const surrealdb = inject('surrealDbService') as SurrealDbService

const user : Ref<User | undefined> = surrealdb.getUserAsRef()

function isRoute(names: string[]): boolean | undefined {
  return names.includes((route.name || '').toString()) || undefined
}

</script>
