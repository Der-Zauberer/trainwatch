<template>

	<div class="container-sm" style="padding-bottom: 0;">
		<SearchComponent :name="stop.value?.name" @search="router.replace({ params: { id: $event } })"/>
	</div>

	<div v-if="stop.error || lines.error" class="container-xl">
		<swd-card class="red-color">
			{{ stop.error || lines.error }}
		</swd-card>
	</div>

	<div class="container-xl grid-cols-md-2 grid-cols-1" v-if="stop.value">

		<div class="grid-cols-1">

			<div class="tab">
				<button class="grey-color" :selected="boardView === Board.DEPARTURE ? true : undefined" @click="boardView = Board.DEPARTURE">{{ $t('entity.traffic.departure') }}</button>
				<button class="grey-color" :selected="boardView === Board.ARRIVAL ? true : undefined" @click="boardView = Board.ARRIVAL">{{ $t('entity.traffic.arrival') }}</button>
				<button class="grey-color" :selected="boardView === Board.STOP ? true : undefined" @click="boardView = Board.STOP" v-if="isMobileView">{{ $t('entity.stop.stop') }}</button>
			</div>

			<div v-if="board.value && (!isMobileView || boardView !== Board.STOP)">
				<BoardLineComponent :line="board.value" :arrival="boardView === Board.ARRIVAL" :stop="stop.value"/>
			</div>

		</div>

		<div v-if="!isMobileView || boardView === Board.STOP">
			
			<swd-card class="grid-cols-1">
				<h4>
					{{ stop.value.name }}
					<swd-subtitle> 
						{{ [stop.value.address?.federalState, stop.value.address?.country].join(', ') }} 
					</swd-subtitle>
				</h4>
				<div>
					<div>{{ stop.value.address?.street }}</div>
					<div>{{ [stop.value.address?.zipcode, stop.value.address?.city].join(' ') }}</div>
				</div>
				<div class="flex flex-wrap">
					<swd-chip v-for="service of getServices(stop.value)" :key="service">
						<swd-icon class="done-icon"></swd-icon> 
						{{ $t('entity.stop.services.' + service) }}
					</swd-chip>
				</div>
				<div class="flex flex-end">
					<a :href="urls.createDbStationUrl(stop.value)" target="_blank" class="button grey-color">bahnhof.de&nbsp;&nbsp;<swd-icon class="external-icon"/></a>
					<a :href="urls.createGoogleMapsUrl(stop.value)" target="_blank" class="button grey-color">Google Maps&nbsp;&nbsp;<swd-icon class="external-icon"/></a>
				</div>
			</swd-card>

			<swd-card class="grid-cols-1" v-if="stop.value.ids">
				<h5>{{ $t('entity.general.id', 2) }}</h5>
				<div class="flex flex-wrap">
					<div v-for="[key, value] of Object.entries(stop.value.ids)" :key="key">
						<div>{{ key.toUpperCase() }}</div>
						<div class="flex margin-0">
							<swd-chip v-for="name of [value].flat()" :key="name">{{ name }}</swd-chip>
						</div>
					</div>
				</div>
			</swd-card>

			<div class="sources" v-if="stop.value.sources.length">
				<swd-card class="sources__headline top-item">
					<h5>{{ $t('entity.source.source', stop.value.sources.length) }}</h5>
				</swd-card>
				<swd-card class="sources__body bottom-item margin-0" v-if="stop.value.ids">
					<a class="button ghost" v-for="source of stop.value.sources" :key="source.name" v-bind:href="source.url">
						{{ source.name }}
						<swd-subtitle>{{ source.url }}</swd-subtitle>
						<swd-subtitle>{{ $t('entity.source.updated') }}: {{ new Date(source.updated).toLocaleDateString() }}</swd-subtitle>
					</a>
				</swd-card>
			</div>

		</div>

	</div>
</template>

<style scoped>

.tab {
	display: flex;
	flex-direction: row;
}

.tab button {
	width: 100%;
	text-align: center;
	border-radius: 0;
}

.tab button:first-child {
	border-radius: var(--theme-border-radius) 0 0 var(--theme-border-radius);
}

.tab button:last-child {
	border-radius: 0 var(--theme-border-radius) var(--theme-border-radius) 0;
}

.sources .sources__headline {
	padding-bottom: 0px;
}

.sources .sources__body {
	padding: calc(round(.5em,1px) - var(--theme-border-width));
}

.sources .sources__body a {
	max-width: 100%;
}
</style>

<script setup lang="ts">
import BoardLineComponent from '@/components/BoardLineComponent.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import { resource } from '@/core/resource';
import type { Stop, BoardLine } from '@/core/types';
import type { SurrealDbService } from '@/services/surrealdb.service';
import { RecordId } from 'surrealdb';
import { inject, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

enum Board { DEPARTURE, ARRIVAL, STOP }

const route = useRoute()
const router = useRouter()
const surrealdb = inject('surrealDbService') as SurrealDbService

const isMobileView = ref<boolean>(window.innerWidth < 768)
const boardView = ref<Board>(Board.DEPARTURE)

const urls = {
	createDbStationUrl: (stop: Stop) => `https://www.bahnhof.de/${encodeURI(stop.id.id.toString().replace('_', '-'))}`,
	createGoogleMapsUrl: (stop: Stop) => {
		const querry = [stop.name, stop.address?.street, stop.address?.zipcode, stop.address?.city, stop.address?.country]
			.filter(entry => entry !== undefined)
			.map(entry => encodeURI(entry))
			.join('%2C')
		return `https://www.google.com/maps/search/?api=1&query=${querry}`
	}
}

onMounted(() => window.addEventListener('resize', updateWindowWidth))
onUnmounted(() => window.removeEventListener('resize', updateWindowWidth))

function updateWindowWidth() {
	isMobileView.value = window.innerWidth < 768
	if (!isMobileView.value && boardView.value == Board.STOP) {
		boardView.value = Board.DEPARTURE
	}
}

const stop = resource({
	parameter: { route },
	loader: (parameter) => surrealdb.select<Stop>(new RecordId('stop', parameter.route.params.id))
})

const lines = resource({
	parameter: { route },
	loader: (parameter) => surrealdb.query<BoardLine[][]>(`fn::line::board(stop:${parameter.route.params.id});`).then(response => response.flat())
})

const board = resource<BoardLine[], unknown>({
	parameter: { lines, boardView },
	loader: () => lines.value?.filter(lines => stop.value?.id.id !== (boardView.value == Board.ARRIVAL ? lines.stops[0].id.id : lines.stops.slice(-1)[0].id.id)) || []
})

function getServices(stop: Stop) {
	return Object.entries(stop.services).filter(entry => Boolean(entry[1])).map(entry => entry[0])
}

</script>
