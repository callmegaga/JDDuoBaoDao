(a = this.$axios.post(this.serviceURL.offerPrice, {
    auctionId: this.auctionInfo.id,
    price: this.price,
    entryid: entryid,
    trackId: Object(v.c)(),
    eid: e,
    token: jab.getData()
}, {
    transformRequest: [function(t) {
        var e = "";
        for (var a in t)
            e += encodeURIComponent(a) + "=" + encodeURIComponent(t[a]) + "&";
        return e
    }]
}))