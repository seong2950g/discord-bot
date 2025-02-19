const cheerio = require("cheerio");

module.exports = { getChampionInfo }

async function getChampionInfo(cheerioLoadData) {
    try {
        const $ = cheerioLoadData;
        const championTier = $('#content-container > main > div.mode-header-container > div > div.inner > div.css-1rjiik1.ehsx5hv1 > div.img-box > div > img').attr('alt');
        const championWinRate = $('#content-container > main > div.mode-header-container > div > div.inner > div.rate-info > div')
                    .children('div').eq(0).find('div.css-oxevym.e1myk9su2').text().trim();
        const championPickRate = $('#content-container > main > div.mode-header-container > div > div.inner > div.rate-info > div')
                    .children('div').eq(1).find('div.css-oxevym.e1myk9su2').text().trim();

        //console.log(`championTier: ${championTier}\nchampioniWinRate: ${championWinRate}\nchampionPickRate: ${championPickRate}`);
        const championInfo = {
            championTier: championTier,
            championWinRate: championWinRate,
            championPickRate: championPickRate,
        }
        return championInfo;
    } catch (error) {
        console.error("❌ 데이터 가져오기 실패:", error.message);
    }
}