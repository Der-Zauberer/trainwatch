<template>
    <swd-card v-for="line of Array.isArray(line) ? line : [line]" :key="line.id.id">
		<div class="flex margin-0">
			<div>{{ dateToTime(arrival ? line.arrival.time : line.departure.time) }}</div>
			<div>
				<DesignationChipComponent :type="line.line.route"/>
			</div>
			<h5 class="width-100">
                {{ line.stops[line.stops.length - 1].name }}
			    <swd-subtitle>{{ line.stops[0].name }}</swd-subtitle>
			</h5>
			<div>{{ arrival ? line.arrival.platform : line.departure.platform }}</div>
		</div>
	    <swd-subtitle>{{ getStops(line).join(' &middot; ') }}</swd-subtitle>
	</swd-card>
</template>

<script lang="ts" setup>
import type { BoardLine, Stop } from '@/core/types';
import DesignationChipComponent from './DesignationChipComponent.vue';
import { dateToTime } from '@/core/functions';

const props = defineProps<{ line: BoardLine | BoardLine[], stop?: Stop, arrival?: boolean}>()

function getStops(line: BoardLine): string[] {
    if (!props.stop) return line.stops.map(stop => stop.name)
	const position = line.stops.map(stop => stop.id.id).indexOf(props.stop.id.id)
	const stops = props.arrival ? line.stops.slice(0, position) : line.stops.slice(position + 1)
    return stops.map(stop => stop.name)
}
</script>