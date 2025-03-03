const info = require("./utils/info.js");
const axios = require("axios");
const cheerio = require("cheerio");
const trans = require("./utils/trans.js");
const { getChampionEmoji, getTierEmoji } = require("./utils/lolEmoji.js");
const { getChampionInfo } = require("./utils/getChampionInfo.js");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('칼바람티어')
		.setDescription('칼바람 티어 정보를 제공합니다.')
		.addStringOption(option =>
			option.setName('kr-champion-name')
				.setDescription('챔피언 이름을 입력하세요.')
				.setRequired(true)),
    async execute(interaction) {
        const krChampionName = interaction.options.getString('kr-champion-name', true).trim();
        if (!trans.isValidChampionName(krChampionName)) return interaction.reply("❌ 유효하지 않은 챔피언 이름입니다.");
        
        const engChampionName = trans.nameKrToEng(krChampionName);
        const URL = `https://www.op.gg/modes/aram/${engChampionName}/build?region=${info.region}&tier=${info.tier}&patch=${info.patch}`;
        const res = await axios.get(URL);
        const $ = cheerio.load(res.data);

        const { championTier, championWinRate, championPickRate } = await getChampionInfo($);

        const embed = new EmbedBuilder()
        .setAuthor({
            name: "무작위 총력전",
            url: 'https://www.op.gg/modes/aram',
        })
        .setTitle(`${getTierEmoji(championTier)} ${getChampionEmoji(engChampionName)} ${krChampionName}`)
        .setURL(`https://www.op.gg/modes/arm/${engChampionName}/build?region=${info.region}&tier=${info.tier}&patch=${info.patch}`)
        .setDescription(`승률 \`${championWinRate}\``)
        .setColor("#00b0f4")

        interaction.reply({ embeds : [embed] });
    },
};