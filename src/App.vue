<template>
	<div id="app">
		<item-info @init-browser="initBrowser" @go-to-bid="goToBid" @search="search">

		</item-info>
		<el-row>
			<el-col :span="14">
				<history-price :history-data="historyData">

				</history-price>
			</el-col>
			<el-col :span="10">
				<bid-info :info="info"></bid-info>
			</el-col>
		</el-row>
	</div>
</template>

<script>
import ItemInfo from "./components/ItemInfo";
import HistoryPrice from "./components/HistoryPrice";
import BidInfo from "./components/BidInfo";

export default {
	name: 'App',
	components: {
		BidInfo,
		HistoryPrice,
		ItemInfo
	},
	data() {
		return {
			historyData: [],
			info: []
		}
	},
	mounted() {

	},
	methods: {
		goToBid(id, price, modeValue) {
			window.startBid(id, price, modeValue)
		},
		search(id) {
			console.log(id)
		},
		initBrowser() {
			console.log("启动浏览器，准备登录")
			window.startInit()
		},
	}
}
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 20px;
}
</style>
