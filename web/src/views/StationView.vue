<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<template>
	<div class="container-md">

		<SearchComponent @search="parameter.id = $event"/>

		<swd-card>
			<h3>
				<span>{{ stop?.name }}</span>
				<swd-subtitle>{{ stop?.address?.federalState }}, {{ stop?.address?.country }}</swd-subtitle>
			</h3>
			<div class="margin-bottom">
				<div>{{ stop?.address?.street }}</div>
				<div>{{ stop?.address?.zipcode }} {{ stop?.address?.city }}</div>
			</div>
			<div class="margin-bottom">
				<label i18n="stop.openingHours"></label>
				<div>Montag: {{ stop?.open?.monday }} </div>
				<div>Dienstag: {{ stop?.open?.tuesday }} </div>
				<div>Mittwoch: {{ stop?.open?.monday }} </div>
				<div>Donnerstag: {{ stop?.open?.monday }} </div>
				<div>Freitag: {{ stop?.open?.monday }} </div>
				<div>Samstag: {{ stop?.open?.monday }} </div>
				<div>Sonntag: {{ stop?.open?.monday }} </div>
			</div>
			<div class="margin-bottom">
				<label i18n="stop.services"></label>
				<div v-if="stop?.services" class="flex flex-wrap">
					<swd-chip v-for="service of Object.entries(stop.services).filter(entry => entry[1] === true).map(entry => entry[0])" :key="service">
						<swd-icon class="done"/> {{ service }}
					</swd-chip>
				</div>
			</div>
			<div class="flex flex-end">
				<a href="#" class="button grey">bahnhof.de&nbsp;&nbsp;<swd-icon class="external"/></a>
				<a href="#" class="button grey">Google Maps&nbsp;&nbsp;<swd-icon class="external"/></a>
			</div>
		</swd-card>
		   
		<swd-card class="flex flex-wrap">
			<div v-if="stop?.ids" v-for="[key, value] of Object.entries(stop.ids)" :key="key">
				<label>{{ key }}</label>
				<div>
					<swd-chip v-if="Array.isArray(value)" v-for="name of Array.from(value)" :key="name" class="flex flex-wrap"> {{ name }}</swd-chip>
					<swd-chip v-if="!Array.isArray(value)">{{ value }}</swd-chip>
				</div>
			</div>
		</swd-card>

		<swd-card class="sources">
			<a v-if="stop?.sources" v-for="source of stop.sources" :key="source.name" v-bind:href="source.url" class="button ghost">
				{{ source.name }}
				<swd-subtitle>{{ source.url }}</swd-subtitle>
				<swd-subtitle>Last updated: {{ source.updated }}</swd-subtitle>
			</a>
		</swd-card>

	</div>
</template>

<script setup lang="ts">
import SearchComponent from '@/components/SearchComponent.vue';
import type { Stop } from '@/types';
import { xref } from '@/xref';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ id: 'singen_hohentwiel' })

const stop = xref({
	parameter,
	loader: () => surrealdb.select<Stop>(new RecordId('stop', parameter.id))
})

</script>
