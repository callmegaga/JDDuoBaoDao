const puppeteer = require('puppeteer-core');
const findChrome = require('./node_modules/carlo/lib/find_chrome');
const querystring = require("querystring");
const http = require("http");
const https = require("https");
const API = require("./api");
const Para = require("./para");
const axios = require("axios");

const Item_ID = 115956585;
const MaxPrice = 5;
const Item_URL = "http://paipai.jd.com/auction-detail/" + Item_ID;
let IsFirstOfferPrice = true;
let page;
let isStar = false;
let entryid, trackId, eid, token, cookie;

cookie = "shshshfpa=7cfb5f3d-cc02-4100-6c77-6bfa255b99fd-1556551047; shshshfpb=xutDOhf7WKy%20vG%2FriMj8nUw%3D%3D; user-key=b35c73d2-590b-49f7-8bb3-4159bb42c4c6; cn=5; areaId=22; ipLoc-djd=22-1930-49322-0; __jdv=122270672|baidu|-|organic|not set|1565363664173; _c_id=1stoc5q735wg7zfhrj515657854491300jfy; pinId=H5yEz6vzT_61ffsfn98I-w; _tp=SKRJ1RA7jTBAA8rl%2B%2B2PRw%3D%3D; _gcl_au=1.1.227075814.1566009655; __jdu=2062738562; shshshfp=3f7ff5fcaf8fef7fa12483d31689d199; pin=moon8sky; __tak=8382066cb44c10bff147f7cccdb007d858b9574d38b21db03d1a477cd9c6ec55537d7c0596cc6240b166fb9ff931b8d8c20b4546e33d6a6783926dbdba735819a5f5138ffaae4c7b97a8225c27d43323; wlfstk_smdl=vqbzyoge3ikf07a5yqaiq61mpzzr4jlz; TrackID=10QhUcVrHdZVrwlsIK9vvVq428dXfKM0Ky51a7iv6ZWJw2i0hbGl1AKEgkLZHkjWVMin__uEAWHSimS6wXtJdnbLtVup_E_gqJQxynkMDnsU; ceshi3.com=201; logining=1; __jda=148612534.2062738562.1556547281.1566098552.1566134252.33; __jdc=148612534; 3AB9D23F7A4B3C9B=VKVDC3HJMGEKVPMRW53PKMGTIALHSLZVOWT3LISOKDL5LMWMPQVGNQ2SMDMVKKGHMZ2F6ZOOC7WCM5X455LFFNO2XM; __jdb=148612534.6.2062738562|33.1566134252";

/**
 * 启动浏览器，加载页面
 * */
(async () => {
    let findChromePath = await findChrome({});
    let executablePath = findChromePath.executablePath;

    const browser = await puppeteer.launch({
        executablePath,
        headless: false,
        defaultViewport: {
            width: 1920,
            height: 1080,
            isLandscape: true
        },
        args: ['--start-maximized']
    });
    page = await browser.newPage();
    await page.setRequestInterception(true);

    // 页面加载完成需要判断是否登录
    page.on("load", async function () {

        if (page.url() === "http://paipai.jd.com/auction-list/"){
            if (!await isPageLogin(page)){
                let login_btn = await page.$(".pp-shortcut__btn-login");

                if (login_btn){
                    login_btn.click();
                }
            }else {
                await page.goto(Item_URL);
            }

        }

        if (page.url() === Item_URL) {
            if (isStar === false){
                getItemPriceAndTime(handlePriceAndTime);
                isStar = true;
            }
        }
    });

    // 对请求进行拦截，如果是出价的请求，则拦截第一次，获取到entryid, trackId, eid
    page.on('request', function (interceptedRequest ) {
        if(interceptedRequest.url() === API.offer_price){
            let post_data = interceptedRequest.postData();
            let price;
            if (post_data){
                let post_data_obj = querystring.parse(post_data);
                entryid = post_data_obj.entryid;
                trackId = post_data_obj.trackId;
                eid     = post_data_obj.eid;
                token   = post_data_obj.token;
                price   = post_data_obj.price;

            }

            // 随意点击页面，让提示信息框消失
            // setTimeout(function () {
            //     page.mouse.click(200, 200);
            // },1000);
            interceptedRequest.abort();
            //interceptedRequest.continue();
            buyByAPI(price);
            //IsFirstOfferPrice ? interceptedRequest.abort() : interceptedRequest.continue();
            IsFirstOfferPrice = false;
        }else {
            interceptedRequest.continue();
        }
    });

    await page.goto('http://paipai.jd.com/auction-list/');

})();

/**
 * 获得该商品当前的出价和剩余竞拍时间
* */
function getItemPriceAndTime(callback){
    const postData = querystring.stringify(Para.get_item_detail_para(Item_ID));

    const options = {
        method: "POST",
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": Buffer.byteLength(postData),
            "Referer": Item_URL,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
        }
    };

    const req = http.request(API.item_detail, options, (res) => {
        let rawData = "";

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
            let data = JSON.parse(rawData);
            let currentTime = data.data.currentTime;
            let auctionInfo = data.data.auctionInfo;

            let currentPrice = auctionInfo.currentPrice;
            currentPrice = currentPrice === null ? 1 : currentPrice;
            let endTime = auctionInfo.endTime;
            callback(currentPrice, endTime - currentTime);
        });
    });

    req.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
    });

    req.write(postData);
    req.end();
}


/**
 * 根据当前的出价和剩余时间做处理
 * 若剩余时间大于3s，每2s刷新一次，小于3s，就100ms刷新一次
 * 执行购买逻辑
* */
function handlePriceAndTime(price, time){

    console.log("当前价格：" + price);
    console.log("剩余抢购时间（毫秒）：" + time);

    if (IsFirstOfferPrice){
        buyByPage(1);
    }

    // let next_refresh_time = 2000;
    // if (price > MaxPrice){
    //     console.log("超过最高价格，抢购结束");
    //     return;
    // }
    //
    // if (time < 0){
    //     console.log("抢购时间结束");
    //     return;
    // }
    //
    //
    // if (time < 3000) next_refresh_time = 100;
    //
    // if(time < 1000){
    //     buyByAPI(price+2);
    // }
    //
    // setTimeout(function () {
    //     getItemPriceAndTime(handlePriceAndTime);
    // }, next_refresh_time)
}

/**
 * 通过操作页面的按钮，来进行出价
 * */
async function buyByPage(price){
    // 点击输入框右边，以便光标能在最右边，删除键能删除所有的输入
    await page.mouse.click(1000, 492);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(price.toString());
    await page.mouse.click(900, 600);
}

/**
 * 通过直接调用api接口去出价
 * */
async function buyByAPI(price){
    let para = Para.get_offer_price_para(Item_ID, price);
    if (entryid === undefined || trackId === undefined || eid === undefined || cookie === undefined){
        console.log("没有正确获取到entryid，trackId，eid，无法执行购买");
    }else {
        let token = await page.evaluate(() => jab.getData());
        para.entryid = entryid;
        para.trackId = trackId;
        para.eid = eid;
        para.token = token;
        requestOfferPrice(para);
    }
}

/**
 * 判断页面是否需要登录
* */
async function isPageLogin(page) {
    let login_btn = await page.$(".pp-shortcut__btn-login");
    if (login_btn){
        return false
    } else {
        return true
    }
}

/**
 * 发出出价的请求
* */
function requestOfferPrice(para) {
    let postData = querystring.stringify(para);
    postData += "&";
    console.log(cookie);

    const options = {
        method: "POST",
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": Buffer.byteLength(postData),
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
            "Cookie":cookie,
        }
    };

    const req = http.request(API.offer_price, options, (res) => {
        let rawData = "";

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
            console.log(rawData)
        });
    });

    req.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

let instance = axios.create({
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    withCredentials: !0
});

function requestOfferPriceByAxios(para) {
    instance.post(API.offer_price, para, {
        transformRequest: [function(t) {
            let e = "";
            for (let a in t)
                e += encodeURIComponent(a) + "=" + encodeURIComponent(t[a]) + "&";
            return e
        }]
    }).then(function (data) {
        console.log(data)
    })
}