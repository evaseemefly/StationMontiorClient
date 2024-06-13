<template>
	<div></div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
@Component({})
export default class DataChart1 extends Vue {
	mydata: any = null
	mounted() {
		console.log('DataChart1 mounted')
	}
	created() {
		console.log('DataChart1 created')
	}
	unmounted() {
		console.log('DataChart1 unmounted')
	}
	updated() {
		console.log('DataChart1 updated')
	}
}
</script>
<style scoped></style>
