/**
 * 一些接口的参数
* */
const Para = {
    get_offer_price_para: function (item_id, price) {
        return {
            auctionId: item_id,
            price: price,
        }
    },
};
module.exports = Para;