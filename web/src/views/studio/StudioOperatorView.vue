<template>
    <div class="container-xl">
        <TableComponent v-model="parameter.name" :loading="operators.loading" @add="edit = create">
            <div>
                <div>Id</div>
                <div>Name</div>
            </div>
            <a v-for="operator of operators.value" :key="operator.id.id.toString()" @click="editRecord = operator.id">
                <div><samp class="id">{{ operator.id.id.toString() }}</samp></div>
                <div>{{ operator.name }}<swd-subtitle>{{ [operator.address.federalState, operator.address.country].join(', ') }}</swd-subtitle></div>
            </a>
        </TableComponent>
    </div>

    <EditDialogComponent  @update="operators.reload()" v-model:record="editRecord" v-model:edit="edit">
        <div class="grid-cols-xl-2 grid-cols-1" v-if="edit">
            <div class="grid-cols-sm-2 grid-cols-1">
                <h6 class="grid-span-2">{{ $t('entity.general.general') }}</h6>
                <InputComponent :label="$t('entity.general.id')" :disabled="!!editRecord" v-model="edit.id.id"></InputComponent>
                <InputComponent :label="$t('entity.general.name')" v-model="edit.name"></InputComponent>
                <InputComponent :label="$t('entity.operator.website')" v-model="edit.website"></InputComponent>
            </div>
            <div class="grid-cols-xl-2 grid-cols-1">
                <h6 class="grid-cols-sm-2 grid-cols-1">{{ $t('entity.address.address') }}</h6>
                <InputComponent :label="$t('entity.address.street')" v-model="edit.address.street" class="grid-cols-sm-2 grid-cols-1"></InputComponent>
                <InputComponent :label="$t('entity.address.zipcode')" v-model="edit.address.zipcode"></InputComponent>
                <InputComponent :label="$t('entity.address.city')" v-model="edit.address.city"></InputComponent>
                <InputComponent :label="$t('entity.address.federalState')" v-model="edit.address.federalState"></InputComponent>
                <InputComponent :label="$t('entity.address.country')" v-model="edit.address.country"></InputComponent>
            </div>
        </div>
    </EditDialogComponent>
</template>

<script setup lang="ts">
import EditDialogComponent from '@/components/EditDialogComponent.vue';
import InputComponent from '@/components/InputComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { resource } from '@/core/resource';
import type { Operator } from '@/core/types';
import type Surreal from 'surrealdb';
import { RecordId } from 'surrealdb';
import { inject, reactive, ref } from 'vue';

const surrealdb = inject('surrealdb') as Surreal

const parameter = reactive({ name: '' })
const operators = resource({
    parameter,
	loader: (parameter) => surrealdb.query<Operator[][]>(`SELECT * FROM operator ${ parameter.name ? 'WHERE name CONTAINS $name' : '' } LIMIT 1000`, parameter).then(response => response[0].slice(0, 100))
})

const editRecord = ref<RecordId<string> | undefined>(undefined)
const edit = ref<Operator | undefined>(undefined)

const create: Operator = {
    id: new RecordId('operator', ''),
    name: '',
    address: {
        street: '',
        zipcode: '',
        city: '',
        federalState: '',
        country: ''
    },
    website: ''
}

</script>