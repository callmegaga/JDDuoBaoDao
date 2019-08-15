const Para = {
    get_item_list_para: function () {
        return {
            pageNo: 1,
            pageSize: 50,
            category1: "",
            status: "",
            orderDirection: 1,
            orderType: 1,
            callback: "__jp1"
        }
    },

    get_item_result_para: function (item_id) {
        return {
            auctionId: item_id,
            callback: "__jp1"
        }
    },

    get_offer_price_para: function (item_id, price) {
        return {
            auctionId: item_id,
            price: price,
            entryid:"",
            trackId: "b674692e5ae20c2f0effc595cfa26f1e",
            eid: "2QVQABUUJ7KEIIY7DNE73QQJQ52M2HNRAORX66H2POFG6B5SNPHREKBIBE4SAMVGPKA4XZ7DGWA4NYMGDG2JIHD5RQ"
        }
    },

    get_item_detail_para: function (item_id) {
        return {
            auctionId: item_id,
        }
    }
};
module.exports = Para;