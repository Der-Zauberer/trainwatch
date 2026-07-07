<template>

	<div class="container-sm" style="padding-bottom: 0;">

		<swd-dropdown>
			<swd-input>
				<input id="search-input" v-model="parameter.name" :placeholder="$t('action.search')">
				<input hidden @select="router.push({ name: 'stop-details', params: { id: ($event.target as HTMLInputElement).value } })">
				<swd-icon class="search-icon" swd-input-icon/>
				<swd-icon class="close-icon" swd-input-reset-icon hidden/>
				<div v-if="search.loading" class="progress-bar"></div>
			</swd-input>
			<swd-dropdown-content>
				<swd-selection onfilter="event.preventDefault();">
					<a v-for="result of search.value" :key="result.id.id.toString()" v-bind:value="result.id.id">{{ result.name }}</a>
				</swd-selection>
			</swd-dropdown-content>
    	</swd-dropdown>
	</div>

	<div v-if="stop.error || lines.error" class="container-xl">
		<swd-card class="red-color">
			{{ search.error || stop.error || lines.error }}
		</swd-card>
	</div>

	<swd-loading-spinner v-if="stop.status === 'LOADING'" loading="true" class="container-xl"></swd-loading-spinner>

	<div class="container-xl grid-cols-md-2 grid-cols-1" v-if="stop.value && stop.status !== 'LOADING'">

		<div class="grid-cols-1">

			<div class="tab">
				<button class="grey-color" :selected="boardView === Board.DEPARTURE ? true : undefined" @click="boardView = Board.DEPARTURE">{{ $t('entity.traffic.departure') }}</button>
				<button class="grey-color" :selected="boardView === Board.ARRIVAL ? true : undefined" @click="boardView = Board.ARRIVAL">{{ $t('entity.traffic.arrival') }}</button>
				<button class="grey-color" :selected="boardView === Board.STOP ? true : undefined" @click="boardView = Board.STOP" v-if="isMobileView">{{ $t('entity.stop.stop') }}</button>
			</div>

			{{ dbBoard.error }}
			<div v-if="dbBoard.value && (!isMobileView || boardView !== Board.STOP)">
				<BoardLineComponent :line="dbBoard.value" :arrival="boardView === Board.ARRIVAL" :stop="stop.value"/>
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
						<swd-subtitle>{{ key.toUpperCase() }}</swd-subtitle>
						<div class="flex margin-0">
							<swd-chip v-for="name of [value].flat()" :key="name">{{ name }}</swd-chip>
						</div>
					</div>
				</div>
			</swd-card>

			<div class="sources" v-if="stop.value.sources?.length">
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

.progress-bar {
  position: absolute;
  left: 0;
  bottom: calc(var(--theme-border-width) / -1);
  overflow: hidden;
  width: 100%;
  height: var(--theme-border-width);
  border-radius: 0 0 var(--theme-border-radius) var(--theme-border-radius);
  background: var(--theme-element-secondary-color);
}

.progress-bar::before {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: var(--theme-primary-color);
  border-radius: inherit;
  animation: bar-animation 0.8s linear infinite;
}

@keyframes bar-animation {
  from { transform: translateX(-150%) }
  to { transform: translateX(300%) }
}

</style>

<script setup lang="ts">
import BoardLineComponent from '@/components/BoardLineComponent.vue'
import { resource } from '@/core/resource'
import type { Stop, BoardLine, Entity } from '@/core/types'
import { useDbTimeTableService } from '@/services/db-timetable.service'
import { useSurrealDbService } from '@/services/surrealdb.service'
import { RecordId } from 'surrealdb';
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

enum Board { DEPARTURE, ARRIVAL, STOP }

const route = useRoute()
const router = useRouter()
const surreal = useSurrealDbService()
const timetable = useDbTimeTableService()

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

const parameter = reactive({ name: '' })

const search = resource({
    parameter,
    loader: (parameter) => !parameter.name ? [] : surreal.up().then(() => surreal.query<Entity<'stop'>[]>('fn::stop::search($name).{id, name}', { name: parameter.name }).then(result => result.flat().splice(0, 20)))
})

const stop = resource({
	parameter: { route },
	loader: (parameter) => parameter.route.params.id ? surreal.up().then(() => surreal.select<Stop>(new RecordId('stop', parameter.route.params.id))) : undefined
})

const lines = resource({
	parameter: { route },
	loader: (parameter) => parameter.route.params.id ? surreal.up().then(() => surreal.query<BoardLine[][]>(`fn::line::board(stop:${parameter.route.params.id});`).then(response => response.flat())) : undefined
})

const board = resource<BoardLine[], unknown>({
	parameter: { lines, boardView },
	loader: () => lines.value?.filter(lines => stop.value?.id.id !== (boardView.value == Board.ARRIVAL ? lines.stops[0].id.id : lines.stops.slice(-1)[0].id.id)) || []
})

const dbBoard = resource<BoardLine[], unknown>({
	parameter: { stop },
	loader: () => stop.value?.ids?.uic ? timetable.getTimetableBoard(stop.value.ids.uic) : undefined
})

function getServices(stop: Stop) {
	return Object.entries(stop.services || []).filter(entry => Boolean(entry[1])).map(entry => entry[0])
}

</script>
