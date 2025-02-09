<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<template>
	<div class="container-md">

		<SearchComponent @search="parameter.id = $event"/>

		<swd-card>
			<h4>
				<span>{{ stop.value?.name }}</span>
				<swd-subtitle>{{ stop.value?.address?.federalState }}, {{ stop.value?.address?.country }}</swd-subtitle>
			</h4>
			<div class="margin-bottom">
				<div>{{ stop.value?.address?.street }}</div>
				<div>{{ stop.value?.address?.zipcode }} {{ stop.value?.address?.city }}</div>
			</div>
			<div class="margin-bottom">
				<label i18n="stop.openingHours"></label>
				<div>Montag: {{ stop.value?.open?.monday }} </div>
				<div>Dienstag: {{ stop.value?.open?.tuesday }} </div>
				<div>Mittwoch: {{ stop.value?.open?.monday }} </div>
				<div>Donnerstag: {{ stop.value?.open?.monday }} </div>
				<div>Freitag: {{ stop.value?.open?.monday }} </div>
				<div>Samstag: {{ stop.value?.open?.monday }} </div>
				<div>Sonntag: {{ stop.value?.open?.monday }} </div>
			</div>
			<div class="margin-bottom">
				<label i18n="stop.services"></label>
				<div v-if="stop.value?.services" class="flex flex-wrap">
					<swd-chip v-for="service of Object.entries(stop.value.services).filter(entry => entry[1] === true).map(entry => entry[0])" :key="service">
						<swd-icon class="done-icon"/> {{ service }}
					</swd-chip>
				</div>
			</div>
			<div class="flex flex-end">
				<a href="#" class="button grey-color">bahnhof.de&nbsp;&nbsp;<swd-icon class="external-icon"/></a>
				<a href="#" class="button grey-color">Google Maps&nbsp;&nbsp;<swd-icon class="external-icon"/></a>
			</div>
		</swd-card>
		   
		<swd-card class="flex flex-wrap">
			<div v-if="stop.value?.ids" v-for="[key, value] of Object.entries(stop.value.ids)" :key="key">
				<span>{{ key }}</span>
				<div class="flex flex-wrap margin-0">
					<swd-chip v-if="Array.isArray(value)" v-for="name of Array.from(value)" :key="name"> {{ name }}</swd-chip>
					<swd-chip v-if="!Array.isArray(value)">{{ value }}</swd-chip>
				</div>
			</div>
		</swd-card>

		<div class="margin-bottom">
			<swd-card class="margin-0 top-item">Sources</swd-card>
			<a v-if="stop.value?.sources" v-for="source of stop.value.sources" :key="source.name" v-bind:href="source.url" class="sources">
				<swd-card class="swd-card-hover margin-0">
					{{ source.name }}
					<swd-subtitle>{{ source.url }}</swd-subtitle>
					<swd-subtitle>Last updated: {{ source.updated }}</swd-subtitle>
				</swd-card>
			</a>
		</div>

	</div>
</template>

<style scoped>
.sources { text-decoration: none }
.sources:not(:first-child) swd-card { border-top-left-radius: 0; border-top-right-radius: 0; }
.sources:not(:last-child) swd-card { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
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

const stop = resource({
	parameter,
	loader: () => surrealdb.select<Stop>(new RecordId('stop', parameter.id))
})

</script>
