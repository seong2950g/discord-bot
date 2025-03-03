const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const info = require("./utils/info.js");
const trans = require("./utils/trans.js");
const { getTierEmoji, getChampionEmoji } = require("./utils/lolEmoji.js");
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('우르프룬')
		.setDescription('우르프 추천 룬 정보를 제공합니다.')
		.addStringOption(option =>
			option.setName('kr-champion-name')
				.setDescription('챔피언 이름을 입력하세요.')
				.setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply(); // 응답 지연
        const krChampionName = interaction.options.getString('kr-champion-name', true).trim();
        if (!trans.isValidChampionName(krChampionName)) return interaction.reply("❌ 유효하지 않은 챔피언 이름입니다.");

        const engChampionName = trans.nameKrToEng(krChampionName);
        const URL = `https://www.op.gg/modes/urf/${engChampionName}/runes?region=${info.region}&tier=${info.tier}&patch=${info.patch}`;
        interaction.channel.send("룬 정보를 가져오고 있습니다. 약 5초의 시간이 소요 됩니다.");

        const { championInfo, attachment, runeWinRate, runePickRate, runeGameCnt } = await this.getRuneUrf(engChampionName);
        const embed = new EmbedBuilder()
        .setAuthor({
            name: "URF",
            url: "https://www.op.gg/modes/urf"
        })
        .setTitle(`${getTierEmoji(championInfo.championTier)} ${getChampionEmoji(engChampionName)} ${krChampionName} \u200B \u200B \u200B \u200B ${championInfo.championWinRate}`)
        .setURL(URL)
        .setDescription(`\`승률 ${runeWinRate}\` \`${runeGameCnt}\` 게임`)
        .setColor("#00b0f4")
        .setImage("attachment://screenshot.png");

        return interaction.editReply({ embeds: [embed], files: [attachment] });
    },

    async getRuneUrf(engChampionName) {
        const URL = `https://www.op.gg/modes/urf/${engChampionName}/runes?region=${info.region}&tier=${info.tier}&patch=${info.patch}`;
        
        try {
            // 브라우저 열기 
            const browser = await puppeteer.launch({ headless: true });
            // 새로운 창 열기
            const page = await browser.newPage();

            // ✅ User-Agent 변경 (봇 탐지 우회)
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );
            await page.goto(URL, { waitUntil: "domcontentloaded" });
            
            await page.click("#content-container > main > div.css-pa089l.e18itsbi0 > div:nth-child(1) > section > ul > li.css-wgv1ux.ei9atkr2");
            await page.click("#content-container > main > div.css-pa089l.e18itsbi0 > div:nth-child(2) > section > table > thead > tr > th.css-106ac29.eyczova2");

            const championTier = await page.$eval('#content-container > main > div.mode-header-container > div.urf.css-oadv09.e1qolk618 > div.inner > div.css-1rjiik1.ehsx5hv1 > div.img-box > div > img', img => img.getAttribute("alt"));
            const championWinRate = await page.$eval('#content-container > main > div.mode-header-container > div.urf.css-oadv09.e1qolk618 > div.inner > div.rate-info > div > div:nth-child(1) > div.css-oxevym.e1myk9su2', el => el.textContent.trim());
            const championPickRate = await page.$eval('#content-container > main > div.mode-header-container > div.urf.css-oadv09.e1qolk618 > div.inner > div.rate-info > div > div:nth-child(2) > div.css-oxevym.e1myk9su2', el => el.textContent.trim());
            const championInfo = {
                championTier: championTier,
                championWinRate: championWinRate,
                championPickRate:  championPickRate,
            }

            const runePickRate = await page.$eval('#content-container > main > div.css-pa089l.e18itsbi0 > div > section > table > tbody > tr:nth-child(1) > td.css-1amolq6.eyczova1 > span', el => el.textContent.trim());
            const runeGameCnt = await page.$eval('#content-container > main > div.css-pa089l.e18itsbi0 > div:nth-child(2) > section > table > tbody > tr:nth-child(1) > td.css-1amolq6.eyczova1 > small', el => el.childNodes[0].textContent.trim());
            const runeWinRate = await page.$eval('#content-container > main > div.css-pa089l.e18itsbi0 > div:nth-child(2) > section > table > tbody > tr:nth-child(1) > td.css-nzr6db.eyczova1', el => el.textContent.trim());
            
    
            const element = await page.$('#content-container > main > div.css-pa089l.e18itsbi0 > div:nth-child(2) > section > table > tbody > tr:nth-child(1) > td.css-brve2o.e4s5fhf0');
            if (!element) {
                console.error("❌ 해당 요소를 찾을 수 없습니다!");
                await browser.close();
                return;
            }
            
            const screenshotBuffer = Buffer.from(await element.screenshot({ type: "png" }));
            if (!screenshotBuffer || !(screenshotBuffer instanceof Buffer)) {
                console.error("❌ 이미지 버퍼가 올바르지 않습니다.");
                await browser.close();
                return;
            }

            const attachment = new AttachmentBuilder(screenshotBuffer, { name: "screenshot.png" });
            await browser.close();

            return { championInfo, attachment, runeWinRate, runePickRate, runeGameCnt };
        } catch (error) {
            console.error("❌ 데이터 가져오기 실패:", error.message);
        }
    }
};