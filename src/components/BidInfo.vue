<template>
    <ul class="bid-info">
        <li v-for="i in info" :key="i.key" class="bid-info-item">{{ i.msg }}</li>
    </ul>
</template>

<script>
    export default {
        name: "BidInfo",
        props: ["info"]
    }
</script>

<style scoped>
    .bid-info{
        list-style: none;
        text-align: left;
        max-height: 700px;
        overflow: auto;
    }
</style>