<template>
    <div class="container-md">
        <p>Hello World!</p>
        <TestComponent />
    </div>
</template>

<script>
import TestComponent from '../components/TestComponent.vue'

export default {
	name: "HomeView",
	components: {
    	TestComponent,
  	},
}
</script>
