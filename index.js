const puppeteer = require('puppeteer-core');
const findChrome = require('./node_modules/carlo/lib/find_chrome');
const querystring = require("querystring");
const http = require("http");
const API = require("./api");
const Para = require("./para");

const Item_ID = 115865743;
const MaxPrice = 20;
const Item_URL = "http://paipai.jd.com/auction-detail/" + Item_ID;
let page;
let isStar = false;

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

    await page.goto('http://paipai.jd.com/auction-list/');

})();

function getItemPriceAndTime(callback){
    const postData = querystring.stringify(Para.get_item_detail_para(Item_ID));

    const options = {
        method: "POST",
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": Buffer.byteLength(postData),
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


function handlePriceAndTime(price, time){

    console.log("当前价格：" + price);
    console.log("剩余抢购时间（毫秒）：" + time);

    let next_refresh_time = 2000;
    if (price > MaxPrice){
        console.log("超过最高价格，抢购结束");
        return;
    }

    if (time < 0){
        console.log("抢购时间结束");
        return;
    }

    if (time < 3000) next_refresh_time = 100;

    if(time < 5000){
        console.log("buy");
        buy(price+2);
    }

    setTimeout(function () {
        getItemPriceAndTime(handlePriceAndTime);
    }, next_refresh_time)
}

async function buy(price){
    // 点击输入框右边，以便光标能在最右边，删除键能删除所有的输入
    await page.mouse.click(1000, 492);
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(price.toString());
    await page.mouse.click(900, 600);
}

async function isPageLogin(page) {
    let login_btn = await page.$(".pp-shortcut__btn-login");
    if (login_btn){
        return false
    } else {
        return true
    }
}