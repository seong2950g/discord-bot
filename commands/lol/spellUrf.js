const info = require("./utils/info.js");
const axios = require("axios");
const cheerio = require("cheerio");
const trans = require("./utils/trans.js");
const { getTierEmoji, getChampionEmoji, getSpellEmoji } = require("./utils/lolEmoji.js");
const { getChampionInfo } = require("./utils/getChampionInfo.js");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('우르프스펠')
		.setDescription('우르프 추천 스펠 정보를 제공합니다.')
		.addStringOption(option =>
			option.setName('kr-champion-name')
				.setDescription('챔피언 이름을 입력하세요.')
				.setRequired(true)),
    async execute(interaction) {
        const krChampionName = interaction.options.getString('kr-champion-name', true).trim();
        if (!trans.isValidChampionName(krChampionName)) return interaction.reply("❌ 유효하지 않은 챔피언 이름입니다.");

        const engChampionName = trans.nameKrToEng(krChampionName);
        const { championInfo, spellList } = await this.getSpellUrf(engChampionName);
        
        const embed = new EmbedBuilder()
        .setAuthor({
            name: "URF",
            url: "https://www.op.gg/modes/urf"
        })
        .setTitle(`${getTierEmoji(championInfo.championTier)} ${getChampionEmoji(engChampionName)} ${krChampionName} \u200B \u200B \u200B \u200B ${championInfo.championWinRate}`)
        .setURL(`https://www.op.gg/modes/urf/${engChampionName}/build?region=${info.region}&tier=${info.tier}&patch=${info.patch}`)
        .setColor("#00b0f4")

        for (let i=0; i<spellList.length; i++) {
            let info = spellList[i];
            let spell = info.spell;
            let value = `${getSpellEmoji(spell[0])} ${getSpellEmoji(spell[1])}`;
            value += `\n\n**승률** \`${info.spellWinRate}\`\n픽률 \`${info.spellPickRate}\`\n게임 \`${info.spellGameCnt}\``;
            embed.addFields({
                name: `추천스펠${i+1}`,
                value: value,
                inline: true
            })
        }

        return interaction.reply({ embeds : [embed] });
    },

    async getSpellUrf(engChampionName) {
        const URL = `https://www.op.gg/modes/urf/${engChampionName}/build?region=${info.region}&tier=${info.tier}&patch=${info.patch}`;

        try {
            const res = await axios.get(URL);
            const $ = cheerio.load(res.data);
            const championInfo = await getChampionInfo($);
            
            // spell containers
            const spellContainer = $('#content-container > main > div > div > div > div.css-jhxxsn.egwzyor3');
            // 추천 스펠을 저장할 배열
            let spellList = [];
            // 배열에 저장할 추천 스펠 빌드의 수
            const spellCnt = 2;
            for (let i=0; i<spellCnt; i++) {
                spellList.push({
                    spell : [
                        $(spellContainer).find('div').children('div').eq(i).find('div.css-0.e108a5t92 > ul > li:nth-child(1) > div img').attr('alt'),
                        $(spellContainer).find('div').children('div').eq(i).find('div.css-0.e108a5t92 > ul > li:nth-child(2) > div img').attr('alt'),
                    ],
                    spellWinRate : $(spellContainer).find('div').children('div').eq(i).find('div > div.win_rate').text(),
                    spellPickRate : $(spellContainer).find('div').children('div').eq(i).find('div > div.pick_rate > strong').text(),
                    spellGameCnt : $(spellContainer).find('div').children('div').eq(i).find('div > div.pick_rate > small').contents().first().text(),
                })
            }
    
            return { championInfo, spellList };
        } catch (error) {
            console.error("❌ 데이터 가져오기 실패:", error.message);
        }
    }
};