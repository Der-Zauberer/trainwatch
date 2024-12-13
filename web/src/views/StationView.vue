<template>
    <div class="container-md">

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
                <label>Öffnungszeiten</label>
                <div>Montag: {{ stop?.open?.monday }} </div>
                <div>Dienstag: {{ stop?.open?.tuesday }} </div>
                <div>Mittwoch: {{ stop?.open?.monday }} </div>
                <div>Donnerstag: {{ stop?.open?.monday }} </div>
                <div>Freitag: {{ stop?.open?.monday }} </div>
                <div>Samstag: {{ stop?.open?.monday }} </div>
                <div>Sonntag: {{ stop?.open?.monday }} </div>
            </div>
            <div class="margin-bottom">
                <label>Sevices</label>
                <div v-if="stop?.services" class="flex flex-wrap">
                    <swd-chip v-for="service of Object.keys(stop.services).filter(key => stop.services[key] === true)" :key="service">
                        <swd-icon class="done"></swd-icon> {{ service }}
                    </swd-chip>
                </div>
            </div>
            <div class="flex flex-end">
                <a href="#" class="button grey">Zu bahnhof.de</a>
                <a href="#" class="button grey">Zu Google Maps</a>
            </div>
        </swd-card>
           
        <swd-card class="flex flex-wrap">
            <div v-if="stop?.ids" v-for="[key, value] of Object.entries(stop.ids)" :key="[key, value]">
                <label>{{ key }}</label>
                <div>
                    <swd-chip v-if="Array.isArray(value)" v-for="name of Array.from(value)" :key="name"> {{ name }}</swd-chip>
                    <swd-chip v-if="!Array.isArray(value)">{{ value }}</swd-chip>
                </div>
            </div>
        </swd-card>

        <swd-card class="sources">
            <a v-if="stop?.sources" v-for="source of stop.sources" :key="source" v-bind:href="source.url" class="button ghost">
                {{ source.name }}
                <swd-subtitle>{{ source.url }}</swd-subtitle>
                <swd-subtitle>Last updated: {{ source.updated }}</swd-subtitle>
            </a>
        </swd-card>

    </div>
</template>

<script>
import { ref, inject, onMounted } from 'vue'
import { StringRecordId } from 'surrealdb';

export default {
    name: 'StationView',
    setup() {
        const surrealdb = inject('surrealdb')
        const stop = ref({})

        onMounted(async () => {
            try {
                const result = await surrealdb.select(new StringRecordId('stop:singen_hohentwiel'))
                stop.value = result;
                console.log(result)
                console.log(Object.keys(result.services).filter(key => result.services[key] === true))
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        });

        return { stop }
    }
}

</script>
