const info = require("./utils/info.js");
const axios = require("axios");
const cheerio = require("cheerio");
const trans = require("./utils/trans.js");
const { getTierEmoji, getChampionEmoji, getItemEmoji } = require("./utils/lolEmoji.js");
const { getChampionInfo } = require("./utils/getChampionInfo.js");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('우르프아이템')
		.setDescription('우르프 추천 아이템 정보를 제공합니다.')
		.addStringOption(option =>
			option.setName('kr-champion-name')
				.setDescription('챔피언 이름을 입력하세요.')
				.setRequired(true)),
    async execute(interaction) {
        const krChampionName = interaction.options.getString('kr-champion-name', true).trim();
        if (!trans.isValidChampionName(krChampionName)) return interaction.reply("❌ 유효하지 않은 챔피언 이름입니다.");

        const engChampionName = trans.nameKrToEng(krChampionName);
        const { championInfo, coreBuildList, shoeList, startItemList, itemList } = await this.getItemUrf(engChampionName);

        // 임베드 field의 value에 입력할 문자열 생성
        let itemValue1 = itemList.slice(0, 4).map(item => `${getItemEmoji(trans.itemNameToNumber(item.item))} \`${item.itemWinRate}\` \`\`${item.itemGameCnt} 게임 \`\``).join("\n");
        let itemValue2 = itemList.slice(4, 8).map(item => `${getItemEmoji(trans.itemNameToNumber(item.item))} \`${item.itemWinRate}\` \`\`${item.itemGameCnt} 게임 \`\``).join("\n");
        let itemValue3 = itemList.slice(8, 12).map(item => `${getItemEmoji(trans.itemNameToNumber(item.item))} \`${item.itemWinRate}\` \`\`${item.itemGameCnt} 게임 \`\``).join("\n");
       
        // 임베드 field의 value에 입력할 문자열 생성
        let startItemValue = "";
        for (let items of startItemList) {
            for (let item of items.item) {
                startItemValue += `${getItemEmoji(trans.itemNameToNumber(item))} `
            }
            startItemValue += `\`${items.startItemWinRate}\`\n\`\`${items.startItemGameCnt} 게임 \`\`\n`
        }
        
        // 임베드 field의 value에 입력할 문자열 생성
        let shoeValue = "";
        for (let shoe of shoeList) {
            shoeValue += `${getItemEmoji(trans.itemNameToNumber(shoe.item))} \`${shoe.shoeWinRate}\`\n\`\`${shoe.shoeGameCnt} 게임 \`\`\n`
        }

        // 임베드 field의 value에 입력할 문자열 생성
        let coreBuildValue = "";
        for (let build of coreBuildList) {
            for (let item of build.item) {
                coreBuildValue += `${getItemEmoji(trans.itemNameToNumber(item))} >`
            }
            coreBuildValue = coreBuildValue.slice(0, -1);
            coreBuildValue += `\`${build.coreBuildWinRate}\`\n\`\`${build.coreBuildGameCnt} 게임 \`\`\n`
        }

        // 임베드 생성 및 제작
        const embed = new EmbedBuilder()
        .setAuthor({
            name: "URF",
            url: "https://www.op.gg/modes/urf",
        })
        .setTitle(`${getTierEmoji(championInfo.championTier)} ${getChampionEmoji(engChampionName)} ${krChampionName} \u200B \u200B \u200B \u200B ${championInfo.championWinRate}`)
        .setURL(`https://www.op.gg/modes/urf/${engChampionName}/items?region=${info.region}&tier=${info.tier}&patch=${info.patch}`)
        .addFields({
            name: "아이템 통계",
            value: itemValue1,
            inline: true
        })
        .addFields({
            name: "\u200B",
            value: itemValue2,
            inline: true
        })
        .addFields({
            name: "\u200B",
            value: itemValue3,
            inline: true
        })
        .addFields({
            name: "핵심 빌드",
            value: coreBuildValue,
            inline: true
        })
        .addFields({
            name: "시작 아이템",
            value: startItemValue,
            inline: true
        })
        .addFields({
            name: "신발",
            value: shoeValue,
            inline: true
        })
        .setColor("#00b0f4")
    
        return interaction.reply({ embeds : [embed] });
    },

    async getItemUrf(engChampionName) {
        const URL = `https://www.op.gg/modes/urf/${engChampionName}/items?region=${info.region}&tier=${info.tier}&patch=${info.patch}`;

        try {
            const res = await axios.get(URL);
            const $ = cheerio.load(res.data);
            const championInfo = await getChampionInfo($);
            
            // 핵심 빌드 containers
            const coreBuildContainer = $('#content-container > main > div.css-pa089l.e1tqucx70 > div > section').first().find('table > tbody > tr').toArray();
            // 승률 기준 내림차순 정렬
            const sortCoreBuildList = coreBuildContainer.sort((a, b) => {
                const valueA = parseFloat($(a).find('td.css-1amolq6.eyczova1').text().trim());
                const valueB = parseFloat($(b).find('td.css-1amolq6.eyczova1').text().trim());
                return valueB - valueA;
            })
            // 핵심 빌드들을 저장할 배열
            let coreBuildList = [];
            // 배열에 저장할 핵심 빌드들의 수
            const coreBuildLength = 3;
            for (let i=0; i<coreBuildLength; i++) {
                let el = sortCoreBuildList[i];
                let items = $(el).find('td > div > div > div img').map((_, img) => $(img).attr('alt')).get();
                let coreBuildWinRate = $(el).find('td.css-1amolq6.eyczova1').text().trim();
                let coreBuildPickRate = $(el).find('td.css-nzr6db.eyczova1 > strong').first().text().trim();
                let coreBuildGameCnt = $(el).find('td > small').contents().first().text().trim();
                coreBuildList.push({
                    item : items,
                    coreBuildWinRate : coreBuildWinRate,
                    coreBuildPickRate : coreBuildPickRate,
                    coreBuildGameCnt : coreBuildGameCnt,
                })
            }
            
            // 신발 containers
            const shoesContainer = $('#content-container > main > div.css-pa089l.e1tqucx70 > div').children('section').eq(1).find('table > tbody > tr').toArray();
            // 승률 기준 내림차순 정렬
            const sortShoesList = shoesContainer.sort((a, b) => {
                const valueA = parseFloat($(a).find('td.css-1amolq6.eyczova1').text().trim());
                const valueB = parseFloat($(b).find('td.css-1amolq6.eyczova1').text().trim());
                return valueB - valueA;
            })
            // 신발들을 저장할 배열
            let shoeList = [];
            // 배열에 저장할 신발 개수
            const shoesListLength = 3;
            for (let i=0; i<shoesListLength; i++) {
                let el = sortShoesList[i];
                let shoe = $(el).find('div > div > strong').text().trim()
                let shoeWinRate = $(el).find('td.css-1amolq6.eyczova1').text().trim();
                let shoePickRate = $(el).find('td.css-nzr6db.eyczova1 > strong').first().text().trim();
                let shoeGameCnt = $(el).find('td > small').contents().first().text().trim(); 
                shoeList.push({
                    item : shoe,
                    shoeWinRate : shoeWinRate,
                    shoePickRate : shoePickRate,
                    shoeGameCnt : shoeGameCnt,
                })
            }
           
            // 시작 아이템 containers
            const startItemContainer = $('#content-container > main > div.css-pa089l.e1tqucx70 > div').children('section').eq(2).find('table > tbody > tr').toArray();
            // 내림차순 정렬
            const sortStartItemList = startItemContainer.sort((a, b) => {
                const valueA = parseFloat($(a).find('td.css-1amolq6.eyczova1').text().trim());
                const valueB = parseFloat($(b).find('td.css-1amolq6.eyczova1').text().trim());
                return valueB - valueA;
            })
            // 시작 아이템들을 저장할 배열
            let startItemList = [];
            // 배열에 저장할 시작 아이템들의 수
            const startItemListLength = 3;
            for (let i=0; i<startItemListLength; i++) {
                let el = sortStartItemList[i];
                let startItem = $(el).find('td > div > div > div > div img').map((_, img) => $(img).attr('alt')).get();
                let startItemWinRate = $(el).find('td.css-1amolq6.eyczova1').text().trim();
                let startItemPickRate = $(el).find('td.css-nzr6db.eyczova1 > strong').first().text().trim();
                let startItemGameCnt = $(el).find('td > small').contents().first().text().trim(); 
                startItemList.push({
                    item : startItem,
                    startItemWinRate : startItemWinRate,
                    startItemPickRate : startItemPickRate,
                    startItemGameCnt : startItemGameCnt,
                })
            }
            
            // 개별 아이템 containers
            const itemContainer = $('#content-container > main > div.css-pa089l.e1tqucx70 > div').children('section').eq(3).find('table > tbody > tr').toArray();
            // 내림차순 정렬
            const sortItemList = itemContainer.sort((a, b) => {
                const valueA = parseFloat($(a).find('td.css-1amolq6.eyczova1').text().trim());
                const valueB = parseFloat($(b).find('td.css-1amolq6.eyczova1').text().trim());
                return valueB - valueA;
            })
            // 개별 아이템을 저장할 배열
            let itemList = [];
            // 배열에 저장할 개별 아이템 수
            const itemListLength = 12;
            for (let i=0; i<itemListLength; i++) {
                let el = sortItemList[i];
                let item = $(el).find('td > div > div > div > div img').attr('alt');
                let itemWinRate = $(el).find('td.css-1amolq6.eyczova1').text().trim();
                let itemPickRate = $(el).find('td.css-nzr6db.eyczova1 > strong').first().text().trim();
                let itemGameCnt = $(el).find('td > small').contents().first().text().trim(); 
                itemList.push({
                    item : item,
                    itemWinRate : itemWinRate,
                    itemPickRate : itemPickRate,
                    itemGameCnt : itemGameCnt,
                })
            }
            
            return { championInfo, coreBuildList, shoeList, startItemList, itemList };
        } catch (error) {
            console.error("❌ 데이터 가져오기 실패:", error.message);
        }
    }
};