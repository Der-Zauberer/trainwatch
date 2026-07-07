<template>
    <div class="container-xl">

        <div class="grid-cols-sm-2  grid-cols-1">

            <swd-loading-spinner :loading="amounts.loading">
                <swd-card class="grid-cols-2">
                    <h4 class="grid-span-2">Statistics</h4>
                    <div class="margin-bottom"><span>{{ amounts.value?.stops || 0 }}</span><swd-subtitle>{{ $t('entity.stop.stop', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.operator || 0 }}</span><swd-subtitle>{{ $t('entity.operator.operator', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.types || 0 }}</span><swd-subtitle>{{ $t('entity.type.type', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.routes || 0 }}</span><swd-subtitle>{{ $t('entity.route.route', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.lines || 0 }}</span><swd-subtitle>{{ $t('entity.line.line', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.journeys || 0 }}</span><swd-subtitle>{{ $t('entity.journey.journey', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.information || 0 }}</span><swd-subtitle>{{ $t('entity.information.information', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.roles || 0 }}</span><swd-subtitle>{{ $t('entity.role.role', 0) }}</swd-subtitle></div>
                    <div class="margin-bottom"><span>{{ amounts.value?.users || 0 }}</span><swd-subtitle>{{ $t('entity.user.user', 0) }}</swd-subtitle></div>
                </swd-card>
            </swd-loading-spinner>

            <swd-card-ghost>
                <h3>Welcome back</h3>
                <p class="primary-color">{{ user?.value?.name }}</p>
            </swd-card-ghost>

        </div>

    </div>
</template>

<script lang="ts" setup>
import { resource } from '@/core/resource'
import { useSurrealDbService } from '@/services/surrealdb.service'
import { surql } from 'surrealdb'

type Amounts = {
    stops: number
    operator: number
    types: number
    routes: number
    lines: number
    journeys: number
    information: number
    roles: number
    users: number
}

const surreal = useSurrealDbService()
const user = surreal.getUser()

const QUARRY = surql`
RETURN {
    stops: count(SELECT id FROM stop),
    operator: count(SELECT id FROM operator),
    types: count(SELECT id FROM type ),
    routes: count(SELECT id FROM route),
    lines: count(SELECT id FROM line),
    journeys: count(SELECT id FROM journey),
    information: count(SELECT id FROM information),
    roles: count(SELECT id FROM role),
    users: count(SELECT id FROM user)
}`

const amounts = resource({ loader: () => surreal.up().then(() => surreal.query<Amounts[]>(QUARRY).then(results => results[0])) })

</script>