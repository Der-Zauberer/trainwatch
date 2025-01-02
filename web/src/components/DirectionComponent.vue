<template>
    <swd-card>
        <div>
            <div>{{ dateToTime(direction.departure.time.scheduled) }}</div>
            <div class="yellow-text" v-if="isDivergence(direction.departure.time)">{{ dateToTime(direction.departure.time.live) }}</div>
        </div>
        <swd-chip class="designation designation-ice">{{ direction.designation.type.name }} {{ direction.designation.number }}</swd-chip>
        <h4 class="margin-0">{{ direction.from.name }}<swd-subtitle>{{ direction.to.name }}</swd-subtitle></h4>
        <div>
            <div>Pl {{ direction.departure.platform.scheduled }}</div>
            <div class="red-text" v-if="isDivergence(direction.departure.platform)">Pl {{ direction.departure.platform.live }}</div>
        </div>
        <div class="stops">Tuttlingen &middot; Stuttgart Hbf &middot; Nürnberg Hbf &middot; Leipzig Hbf</div>
    </swd-card>
</template>

<style scoped>
swd-card {
    display: grid;
    grid-template-columns: fit-content(0) fit-content(0) auto fit-content(0);
    white-space: nowrap;
}
.stops {
    grid-column: span 4;
    font-size: 0.8em;
    color: var(--theme-text-grey-color);
}
.designation {
    font-weight: bold;
    margin: 0 5px 0 10px;
    transform: translateY(4px);
}

.designation-ice {
    background-color: white;
    color: red;
}
</style>

<script setup lang="ts">
import { dateToTime } from '@/functions';
import { ref } from 'vue';

const direction = ref({
    cancelled: false,
    designation: {
        number: '512',
        type: {
            name: 'ICE'
        }
    },
    arrival: {
        time: {
            scheduled: new Date('2024-08-31T10:03'),
            live: new Date('2024-08-31T10:05')
        },
        platform: {
            scheduled: '1',
            live: '1'
        }
    },
    departure: {
        time: {
            scheduled: new Date('2024-08-31T10:03'),
            live: new Date('2024-08-31T10:03')
        },
        platform: {
            scheduled: '1',
            live: '1'
        }
    },
    from: {
        id: 'berlin_hbf',
        name: 'Berlin Hbf',
    },
    to: {
        id: 'singen_hohentwiel',
        name: 'Singen (Hohentwiel)',
    },
    stops: [
        {
            id: 'tuttlingen',
            name: 'Tuttlingen',
            cancelled: false,
        },
        {
            id: 'stuttgart_hbf',
            name: 'Stuttgart Hbf',
            cancelled: false,
        },
        {
            id: 'nuernberg_hbf',
            name: 'Nürnberg Hbf',
            cancelled: false,
        },
        {
            id: 'leipzig_hbf',
            name: 'Leipzig Hbf',
            cancelled: false,
        }
    ]
})

function isDivergence(data: {scheduled: unknown, live: unknown}) {
    return data.scheduled !== data.live
}

</script>