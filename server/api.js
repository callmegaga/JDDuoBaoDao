/**
 * 会用到的京东接口地址
* */
const API = {
    server_host: "used-api.jd.com",
    item_result: "https://used-api.jd.com/auctionRecord/batchCurrentInfo",
    offer_price: "/auctionRecord/offerPrice",
    offer_price_url : "https://used-api.jd.com/auctionRecord/offerPrice",
    item_detail: "https://pp-dbd.jd.com/auction/detail",
    item_url: "https://paipai.jd.com/auction-detail/",
    login_url: "https://passport.jd.com/new/login.aspx?sso=1&ReturnUrl=https://sso.paipai.com/sso/redirect",
    login_success_redirect_url: "https://www.paipai.com/"
};
module.exports = API;