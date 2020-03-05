<template>
    <el-table :data="historyData" border max-height="700" size="mini">
        <el-table-column prop="index" label="#" width="50"></el-table-column>
        <el-table-column prop="name" label="名称"></el-table-column>
        <el-table-column prop="cell" label="成色" width="50"></el-table-column>
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="max_price" label="封顶价格" width="80"></el-table-column>
        <el-table-column prop="price" label="成交价格" width="80"></el-table-column>
    </el-table>
</template>

<script>
    export default {
        name: "HistoryPrice",
        props:["historyData"]
    }
</script>

<style scoped>

</style>