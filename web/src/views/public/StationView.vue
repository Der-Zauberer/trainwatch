<template>

	<div class="container-sm" style="padding-bottom: 0;">
		<SearchComponent @search="parameter.id = $event"/>
	</div>

	<div class="container-xxxl grid-cols-xl-3 grid-cols-md-2 grid-cols-1" v-if="stop.value">

		<div>
			Section1
		</div>

		<div hidden>
			Section2
		</div>

		<div>
			
			<swd-card class="flex flex-column">
				<h4>
					{{ stop.value.name }}
					<swd-subtitle> 
						{{ [stop.value.address.federalState, stop.value.address.country].join(', ') }} 
					</swd-subtitle>
				</h4>

				<div>
					<div>{{ stop.value.address.street }}</div>
					<div>{{ [stop.value.address.zipcode, stop.value.address.city].join(' ') }}</div>
					<div></div>
				</div>

				<div class="flex flex-end">
					<a :href="urls.createDbStationUrl(stop.value)" target="_blank" class="button grey-color">bahnhof.de&nbsp;&nbsp;<swd-icon class="external-icon"/></a>
					<a :href="urls.createGoogleMapsUrl(stop.value)" target="_blank" class="button grey-color">Google Maps&nbsp;&nbsp;<swd-icon class="external-icon"/></a>
				</div>
			</swd-card>

			<swd-card class="flex flex-column" v-if="stop.value.ids">
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
import SearchComponent from '@/components/SearchComponent.vue';
import { resource } from '@/core/resource';
import type { Stop } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ id: 'singen_hohentwiel' })

const urls = {
	createDbStationUrl: (stop: Stop) => `https://www.bahnhof.de/${encodeURI(stop.id.id.toString().replace('_', '-'))}`,
	createGoogleMapsUrl: (stop: Stop) => {
		const querry = [stop.name, stop.address.street, stop.address.zipcode, stop.address.city, stop.address.country]
			.filter(entry => entry !== undefined)
			.map(entry => encodeURI(entry))
			.join('%2C')
		return `https://www.google.com/maps/search/?api=1&query=${querry}`
	}
}

const stop = resource({
	parameter,
	loader: () => surrealdb.select<Stop>(new RecordId('stop', parameter.id))
})

</script>
