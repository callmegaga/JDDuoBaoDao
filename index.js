const puppeteer = require('puppeteer-core');
const findChrome = require('./node_modules/carlo/lib/find_chrome');
const querystring = require("querystring");
const http = require("http");
const API = require("./api");
const Para = require("./para");

const Item_ID = 116110477;
const MaxPrice = 20;
const Item_URL = "http://paipai.jd.com/auction-detail/" + Item_ID;
let IsFirstOfferPrice = true;
let page;
let isStar = false;
let EndTime;
let entryid, trackId, eid, token, cookie;

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

        if (page.url() === API.list_page){
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
                isStar = true;
                // 需要使用两个页面的cookie
                let jd_cookie = await page.cookies("https://passport.jd.com");
                let page_cookie = await page.cookies();
                cookie = mergeCookie(jd_cookie, page_cookie);
                getItemPriceAndTime(function (historyRecord, endTime) {
                    EndTime = endTime;
                    for (let i in historyRecord){
                        console.log("历史价格：" + historyRecord[i].offerPrice);
                    }
                    getBatchInfo()
                });
            }
        }
    });

    // 对请求进行处理，如果是出价的请求，则拦截第一次，获取到entryid, trackId, eid
    page.on('request', async function (request) {
        if(request.url() === API.offer_price){
            let post_data = request.postData();

            if (post_data){
                let post_data_obj = querystring.parse(post_data);
                entryid = post_data_obj.entryid;
                trackId = post_data_obj.trackId;
                eid     = post_data_obj.eid;
                token   = post_data_obj.token;
            }

            // 随意点击页面，让提示信息框消失
            setTimeout(function () {
                page.mouse.click(200, 200);
            },1000);

            buyByAPI(8);

            IsFirstOfferPrice ? request.abort() : request.continue();

            IsFirstOfferPrice = false;
        }else {
            request.continue();
        }
    });

    await page.goto(API.list_page);
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
            let historyRecord = data.data.historyRecord;
            let auctionInfo = data.data.auctionInfo;
            
            let currentPrice = auctionInfo.currentPrice;
            currentPrice = currentPrice === null ? 1 : currentPrice;
            let endTime = auctionInfo.endTime;

            callback(historyRecord, endTime);
        });
    });

    req.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

/**
 * 获得竞拍实时信息
 * */
function getBatchInfo() {
    let url = API.item_result + Para.get_item_result_para(Item_ID);
    http.get(url, function (res) {
        let rawData = "";

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
            rawData += chunk;
        });

        res.on('end', () => {
            let data = eval(rawData);
            let current_time = data.list[0];
            let current_price = data.data[Item_ID].currentPrice;

            handlePriceAndTime(current_price, EndTime - current_time);
        });
    })
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

    let next_refresh_time = 2000;
    if (price + 1 > MaxPrice){
        console.log("超过最高价格，抢购结束");
        return;
    }

    if (time < 0){
        console.log("抢购时间结束");
        return;
    }


    if (time < 3000) next_refresh_time = 100;

    if(time < 1000){
        console.log(`出价${price + 1}`);
        buyByAPI(price + 1);
    }


    if (time < 300){
        console.log("开始密集抢购");
        for(let i = price; i < MaxPrice; i++){
            (function () {
                let now_price = i;
                setTimeout(function (){

                    console.log(`出价${now_price}`);
                    buyByAPI(now_price)

                }, 50);
            })()
        }
        return;
    }

    setTimeout(function () {
        getBatchInfo(handlePriceAndTime);
    }, next_refresh_time)
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

    const options = {
        method: "POST",
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": Buffer.byteLength(postData),
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
            "Cookie":cookie,
            "Referer": Item_URL,
            "Sec-Fetch-Mode": "cors"
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

/**
 * 处理cookie，将两个页面的cookie合并到一起
* */
function mergeCookie(cookie_one, cookie_two) {
    let cookie = {};
    let string = "";
    for (let i in cookie_two){
        cookie[cookie_two[i].name] = cookie_two[i].value;
    }

    for (let i in cookie_one){
        cookie[cookie_one[i].name] = cookie_one[i].value;
    }

    for (let i in cookie){
        string += `${i}=${cookie[i]};`
    }

    return string;
}

/**
 * 处理实时出价信息
* */
function __jp6(value) {
    return value;
}