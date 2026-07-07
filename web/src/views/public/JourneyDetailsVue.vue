<template>
    
    <div class="container-md">
        <LineComponent v-if="journey.value" :journey="journey.value" :line="journeyToLine(journey.value)"/>
    </div>

</template>

<script setup lang="ts">
import LineComponent from '@/components/LineComponent.vue';
import { resource } from '@/core/resource';
import type { JourneyStops, LineStops } from '@/core/types';
import { useSurrealDbService } from '@/services/surrealdb.service';
import { RecordId } from 'surrealdb';
import { useRoute } from 'vue-router';

const route = useRoute()
const surreal = useSurrealDbService()

const journey = resource({
    parameter: route,
    loader: (parameter) => surreal.up().then(() => surreal.query<JourneyStops[]>('fn::journey::stops($id)', { id: new RecordId('journey', parameter.params.id) }).then(results => results[0]))
})

function journeyToLine(journey: JourneyStops): LineStops {
    return {
        id: journey.line.id,
        route: journey.line.route,
        stops: journey.stops.map(stop => ({
            id: stop.id,
            name: stop.name,
            canceled: false,
            arrival: stop.sceduled.arrival,
            departure: stop.sceduled.departure
        }))
    }
}

</script>