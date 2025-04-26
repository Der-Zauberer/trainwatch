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
            <div v-for="stop of line.stops" :key="stop.id.id.toString()" class="stops__row">
                <div>
                    <div>{{ dateToTime(stop.arrival.time) }}</div>
                    <div>{{ dateToTime(stop.departure.time) }}</div>
                </div>
                <div class="stops__graph">
                    <div class="stops__graph--line"></div>
                    <div class="stops__graph--dot"></div>
                </div>
                <div>{{ stop.name }}</div>
                <div>
                    <div>{{ stop.arrival.platform }}</div>
                    <div>{{ stop.departure.platform }}</div>
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
    grid-template-columns: repeat(3, max-content) auto;
    gap: var(--theme-inner-element-spacing);
}

.stops .stops__row {
    display: contents;
}

.stops .stops__row > *:last-child {
    text-align: end;
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
import type { LineStops } from '@/core/types';
import DesignationChipComponent from './DesignationChipComponent.vue';
import { dateToTime } from '@/core/functions';


defineProps<{ line: LineStops }>()

</script>