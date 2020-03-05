<template>
    <div id="app">
        <item-info @go-to-bid="goToBid" @search="search">

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
            let result = [];
            let infos = [];
            for (let i = 0; i < 40; i++) {
                result.push({
                    index: i,
                    name: "Apple iPhone 8 Plus 国行全网通4G手机 银色 64GB",
                    cell: "9",
                    time: "2020-03-03 23:59:48",
                    max_price: 4399,
                    price: 2685
                });
                infos.push({
                    key: i,
                    msg: "cedsdwqfewfwefwefwefefefef"
                })
            }
            this.historyData = result;
            this.info = infos
        },
        methods:{
            goToBid(id, price){
                window.startBid(id, price)
            },
            search(id){
                console.log(id)
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
