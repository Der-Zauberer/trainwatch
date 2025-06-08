<template>
    
    <swd-card>

        <div class="designation">
            <div>
                <DesignationChipComponent :type="line.route"/>
            </div>
            <div>
                {{ line.stops[line.stops.length - 1].name }}
                <swd-subtitle>{{ $t('entity.traffic.from') }} {{ line.stops[0].name }}</swd-subtitle>
            </div>
        </div>
        
        <div class="stops">
            <div v-for="stop of journey?.stops || lineStopsToJourneyStops(line)" :key="stop.id.id.toString()" class="stops__row">
                <div>
                    <div class="stops__sceduled-realtime">
                        <div :class="cancelledStyle(stop)">{{ dateToTime(stop.sceduled.arrival.time) }}</div>
                        <div v-if="!stop.canceled && stop.realtime" :class="delayColor(stop, false)">{{ dateToTime(stop.realtime.arrival.time) }}</div>
                    </div>
                    <div class="stops__sceduled-realtime">
                        <div :class="cancelledStyle(stop)">{{ dateToTime(stop.sceduled.departure.time) }}</div>
                        <div v-if="!stop.canceled && stop.realtime" :class="delayColor(stop)">{{ dateToTime(stop.realtime.departure.time) }}</div>
                    </div>
                </div>
                <div class="stops__graph">
                    <div class="stops__graph--line"></div>
                    <div class="stops__graph--dot"></div>
                </div>
                <div><RouterLink :to="{ name: 'stop', params: { id: stop.id.id.toString() } }" :class="cancelledStyle(stop)">{{ stop.name }}</RouterLink></div>
                <div>
                    <div class="stops__sceduled-realtime">
                        <div :class="isTrackDivergence(stop, false) || stop.canceled ? 'red-text text-line-through' : ''">{{ stop.sceduled.arrival.platform }}</div>
                        <div v-if="isTrackDivergence(stop, false)" class="red-text">{{ stop.realtime?.arrival.platform }}</div>
                    </div>
                    <div class="stops__sceduled-realtime" v-if="stop.sceduled.arrival.platform !== stop.sceduled.departure.platform || stop.realtime?.arrival.platform !== stop.realtime?.departure.platform && isTrackDivergence(stop)">
                        <div :class="isTrackDivergence(stop) || stop.canceled ? 'red-text text-line-through' : ''">{{ stop.sceduled.departure.platform }}</div>
                        <div v-if="isTrackDivergence(stop)" class="red-text">{{ stop.realtime?.departure.platform }}</div>
                    </div>
                </div>
            </div>
        </div>
    </swd-card>

</template>

<style scoped>

.designation {
    display: flex;
    gap: var(--theme-inner-element-spacing);
    font-size: 1.2em;
    margin-bottom: var(--theme-element-spacing);
}

.stops {
    display: grid;
    grid-template-columns: max-content max-content auto max-content;
    gap: var(--theme-inner-element-spacing) calc(var(--theme-inner-element-spacing) / 2);
}

.stops .stops__row {
    display: contents;
}

.stops .stops__row > *:last-child {
    text-align: end;
}

.stops .stops__sceduled-realtime {
    display: flex;
    gap: calc(var(--theme-inner-element-spacing) / 2);
}

.stops .stops__graph {
    position: relative;
    transform: translateY(7px);
}

.stops .stops__graph .stops__graph--dot {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background-color: var(--theme-primary-color);
}

.stops .stops__graph .stops__graph--line {
    position: absolute;
    width: 5px;
    height: calc(100% + var(--theme-inner-element-spacing));
    top: 5px;
    left: 5px;
    background-color: var(--theme-primary-color);
}

.stops :last-child .stops__graph .stops__graph--line {
    display: none;
}

</style>

<script setup lang="ts">
import type { JourneyStops, LineStops } from '@/core/types';
import DesignationChipComponent from './DesignationChipComponent.vue';
import { dateToTime } from '@/core/functions';
import type { RecordId } from 'surrealdb';

type StopData = { id: RecordId<'stop'>, name: string, canceled: boolean, sceduled: { arrival: { platform: string, time: Date }, departure: { platform: string, time: Date } }, realtime?: { arrival: { platform: string, time: Date }, departure: { platform: string, time: Date } }}

defineProps<{ line: LineStops, journey?: JourneyStops }>()

function isTrackDivergence(stop: StopData, departure: boolean = true): boolean {
    if (!stop.realtime || stop.canceled) return false
    if (!departure) return stop.sceduled.arrival.platform !== stop.realtime?.arrival.platform
    return stop.sceduled.departure.platform !== stop.realtime?.departure.platform
}

function lineStopsToJourneyStops(line: LineStops): StopData[] {
    return line.stops.map(stop => ({ id: stop.id, name: stop.name, canceled: false, sceduled: { arrival: stop.arrival, departure: stop.departure }, realtime: undefined }))
}

function cancelledStyle(stop: StopData): string {
    return stop.canceled ? 'red-text text-line-through' : 'dark-text'
}

function delayColor(stop: StopData, departure: boolean = true): string {
    if (!stop.realtime) return ''
    const difference = departure
        ? stop.realtime.departure.time.getTime() - stop.sceduled.departure.time.getTime()
        : stop.realtime.arrival.time.getTime() - stop.sceduled.arrival.time.getTime()
    const minutes = Math.floor(difference / 60000)
    if (minutes > 5) {
        return 'red-text'
    } else if (minutes > 2) {
        return 'yellow-text'
    } else {
        return 'green-text'
    }
}

</script>