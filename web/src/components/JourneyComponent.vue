<template>
    <swd-card>
        <div class="flex">
            <swd-chip class="designation designation-ice">{{ journey.designation.type.name }} {{ journey.designation.number }}</swd-chip>
            <h4 class="margin-0">{{ journey.stops[journey.stops.length - 1].name }}<swd-subtitle>von {{ journey.stops[0].name }}</swd-subtitle></h4>
        </div>
        <div class="stops">
            <div v-for="stop in journey.stops" :key="stop.id" style="display: contents;">
                <div class="journey-divergence" :class="stop.cancelled ? 'journey-cancelled' :''">
                    <div>{{ dateToTime(stop.departure.time.scheduled) }}</div>
                    <div v-if="!stop.cancelled && calculateDelay(stop.departure.time) > 1" :class="calculateDelay(stop.departure.time) > 3 ? 'red-text' : 'yellow-text'">{{ dateToTime(stop.departure.time.live) }}</div>
                </div>
                <div class="graph">
                    <div class="graph-cycle"></div>
                    <div class="graph-line"></div>
                </div>
                <div class="journey-divergence">
                    <div :class="stop.cancelled ? 'journey-cancelled' :''">{{ stop.name }}</div>
                    <div class="red-text" v-if="stop.information">{{ stop.information }}</div>
                </div>
                <div class="journey-divergence-explicit" :class="stop.cancelled ? 'journey-cancelled' :''">
                    <div>Pl {{ stop.departure.platform.scheduled }}</div>
                    <div v-if="!stop.cancelled && isDivergence(stop.departure.platform)">Pl {{ stop.departure.platform.live }}</div>
                </div>
            </div>
        </div>
    </swd-card>
</template>

<style scoped>

.stops {
    display: grid;
    grid-template-columns: fit-content(0) fit-content(0) auto fit-content(0);
    gap: var(--theme-inner-element-spacing) var(--theme-inner-element-spacing);
    white-space: nowrap;
}

.graph {
    position: relative;
    transform: translateY(3px);
}

.graph .graph-cycle {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background-color: var(--theme-primary-color);
}

.graph .graph-line {
    position: absolute;
    width: 5px;
    height: calc(100% + var(--theme-inner-element-spacing));
    top: 5px;
    left: 5px;
    background-color: var(--theme-primary-color);
}

.stops :last-child .graph .graph-line {
    display: none;
}

</style>

<script setup lang="ts">
import { dateToTime } from '@/core/functions';
import { reactive } from 'vue';

const journey = reactive({
    cancelled: false,
    designation: {
        number: '512',
        type: {
            name: 'ICE'
        }
    },
    stops: [
        {
            id: 'singen_hohentwiel',
            name: 'Singen (Hohentwiel)',
            cancelled: false,
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T09:38'),
                    live: new Date('2024-08-31T09:38')
                },
                platform: {
                    scheduled: '1',
                    live: '1'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T09:42'),
                    live: new Date('2024-08-31T09:42')
                },
                platform: {
                    scheduled: '1',
                    live: '1'
                }
            },
        },
        {
            id: 'tuttlingen',
            name: 'Tuttlingen',
            cancelled: false,
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T09:58'),
                    live: new Date('2024-08-31T09:58')
                },
                platform: {
                    scheduled: '3',
                    live: '3'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T10:03'),
                    live: new Date('2024-08-31T10:03')
                },
                platform: {
                    scheduled: '3',
                    live: '3'
                }
            },
        },
        {
            id: 'stuttgart_hbf',
            name: 'Stuttgart Hbf',
            cancelled: false,
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T10:38'),
                    live: new Date('2024-08-31T10:38')
                },
                platform: {
                    scheduled: '8',
                    live: '8'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T10:42'),
                    live: new Date('2024-08-31T10:42')
                },
                platform: {
                    scheduled: '8',
                    live: '8'
                }
            },
        },
        {
            id: 'nuernberg_hbf',
            name: 'Nürnberg Hbf',
            cancelled: false,
            information: 'Verzögerung im Betriebsablauf',
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T11:45'),
                    live: new Date('2024-08-31T11:51')
                },
                platform: {
                    scheduled: '14',
                    live: '15'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T11:51'),
                    live: new Date('2024-08-31T11:54')
                },
                platform: {
                    scheduled: '14',
                    live: '15'
                }
            },
        },
        {
            id: 'erfurt_hbf',
            name: 'Erfurt Hbf',
            cancelled: true,
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T13:00'),
                    live: new Date('2024-08-31T13:00')
                },
                platform: {
                    scheduled: '4',
                    live: '4'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T13:04'),
                    live: new Date('2024-08-31T13:04')
                },
                platform: {
                    scheduled: '4',
                    live: '4'
                }
            },
        },
        {
            id: 'leipzig_hbf',
            name: 'Leipzig Hbf',
            cancelled: false,
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T14:13'),
                    live: new Date('2024-08-31T14:13')
                },
                platform: {
                    scheduled: '10',
                    live: '10'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T14:18'),
                    live: new Date('2024-08-31T14:18')
                },
                platform: {
                    scheduled: '10',
                    live: '10'
                }
            },
        },
        {
            id: 'lutterstadt_wittenberg',
            name: 'Lutterstadt-Wittenberg',
            cancelled: false,
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T14:53'),
                    live: new Date('2024-08-31T14:53')
                },
                platform: {
                    scheduled: '1',
                    live: '1'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T14:55'),
                    live: new Date('2024-08-31T14:55')
                },
                platform: {
                    scheduled: '1',
                    live: '1'
                }
            },
        },
        {
            id: 'berlin_hbf',
            name: 'Berlin Hbf',
            cancelled: false,
            arrival: {
                time: {
                    scheduled: new Date('2024-08-31T15:16'),
                    live: new Date('2024-08-31T15:16')
                },
                platform: {
                    scheduled: '4',
                    live: '4'
                }
            },
            departure: {
                time: {
                    scheduled: new Date('2024-08-31T15:20'),
                    live: new Date('2024-08-31T15:20')
                },
                platform: {
                    scheduled: '4',
                    live: '4'
                }
            },
        }
    ]
})

function isDivergence(data: {scheduled: Date | string, live: Date | string}) {
    return data.scheduled !== data.live
}

function calculateDelay(delay: {scheduled: Date, live: Date}) {
    return Math.round((delay.live.getTime() - delay.scheduled.getTime()) / 60000)
}

</script>