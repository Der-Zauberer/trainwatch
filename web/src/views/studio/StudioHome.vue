<template>
    <div class="container-xl">

        <div class="grid-cols-sm-2  grid-cols-1">

            <swd-loading-spinner :loading="amounts.loading">
                <swd-card class="grid-cols-2">
                    <h4 class="grid-span-2">Statistics</h4>

                    <div class="margin-bottom">
                        <span>{{ amounts.value?.stops || 0 }}</span>
                        <swd-subtitle>Stops</swd-subtitle>
                    </div>
                    <div class="margin-bottom">
                        <span>{{ amounts.value?.operator || 0 }}</span>
                        <swd-subtitle>Operators</swd-subtitle>
                    </div>
                    <div class="margin-bottom">
                        <span>{{ amounts.value?.types || 0 }}</span>
                        <swd-subtitle>Types</swd-subtitle>
                    </div>
                    <div class="margin-bottom">
                        <span>{{ amounts.value?.routes || 0 }}</span>
                        <swd-subtitle>Routes</swd-subtitle>
                    </div>
                    <div class="margin-bottom">
                        <span>{{ amounts.value?.lines || 0 }}</span>
                        <swd-subtitle>Lines</swd-subtitle>
                    </div>
                    <div class="margin-bottom">
                        <span>{{ amounts.value?.journeys || 0 }}</span>
                        <swd-subtitle>Journeys</swd-subtitle>
                    </div>
                    <div class="margin-bottom">
                        <span>{{ amounts.value?.roles || 0 }}</span>
                        <swd-subtitle>Roles</swd-subtitle>
                    </div>
                    <div class="margin-bottom">
                        <span>{{ amounts.value?.users || 0 }}</span>
                        <swd-subtitle>Users</swd-subtitle>
                    </div>
                </swd-card>
            </swd-loading-spinner>

            <swd-card-ghost>

                <h3>Welcome back</h3>
                <p class="primary-color">{{ cookies.getTokenAsRef().value?.payload.ID }}</p>

            </swd-card-ghost>

        </div>

    </div>
</template>

<script lang="ts" setup>
import { resource } from '@/core/resource';
import type { CookieService } from '@/services/cookies.service';
import type Surreal from 'surrealdb';
import { inject } from 'vue';

type Amounts = {
    stops: number
    operator: number
    types: number
    routes: number
    lines: number
    journeys: number
    roles: number
    users: number
}

const surrealdb = inject('surrealdb') as Surreal
const cookies = inject('cookies') as CookieService

const QUARRY = `
RETURN {
    stops: (SELECT count() FROM stop GROUP ALL)[0].count || 0,
    operator: (SELECT count() FROM operator GROUP ALL)[0].count || 0,
    types: (SELECT count() FROM type GROUP ALL)[0].count || 0,
    routes: (SELECT count() FROM route GROUP ALL)[0].count || 0,
    lines: (SELECT count() FROM line GROUP ALL)[0].count || 0,
    journeys: (SELECT count() FROM journey GROUP ALL)[0].count || 0,
    roles: (SELECT count() FROM role GROUP ALL)[0].count || 0,
    users: (SELECT count() FROM user GROUP ALL)[0].count || 0,
}`

const amounts = resource({ loader: () => surrealdb.query<Amounts[]>(QUARRY).then(results => results[0]) })

</script>