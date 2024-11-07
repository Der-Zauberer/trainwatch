<template>
  <swd-card> {{ designation }} {{ destination }} </swd-card>
</template>

<script>
export default {
  name: 'TestComponent',
  data() {
    return {
      designation: 'ICE 512',
      destination: 'Singen (Hohentwiel)',
    }
  },
}
</script>
