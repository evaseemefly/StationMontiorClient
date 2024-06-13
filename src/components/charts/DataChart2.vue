<template>
	<div></div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
@Component({})
export default class DataChart2 extends Vue {
	mydata: any = null
	mounted() {
		console.log('DataChart2 mounted')
	}
	created() {
		console.log('DataChart2 created')
	}
	unmounted() {
		console.log('DataChart2 unmounted')
	}
	updated() {
		console.log('DataChart1 updated')
	}
}
</script>
<style scoped></style>
