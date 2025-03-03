const info = require("./utils/info.js");
const axios = require("axios");
const cheerio = require("cheerio");
const trans = require("./utils/trans.js");
const { getTierEmoji, getChampionEmoji, getSkillEmoji } = require("./utils/lolEmoji.js");
const { getChampionInfo } = require("./utils/getChampionInfo.js");
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('칼바람스킬')
		.setDescription('칼바람 추천 스킬 정보를 제공합니다.')
		.addStringOption(option =>
			option.setName('kr-champion-name')
				.setDescription('챔피언 이름을 입력하세요.')
				.setRequired(true)),
    async execute(interaction) {
        console.time("칼바람스킬");
        const krChampionName = interaction.options.getString('kr-champion-name', true).trim();
        if (!trans.isValidChampionName(krChampionName)) return interaction.reply("❌ 유효하지 않은 챔피언 이름입니다.");

        const engChampionName = trans.nameKrToEng(krChampionName);
        const { championInfo, skillList } = await this.getSkillAram(engChampionName);

        const embed = new EmbedBuilder()
        .setAuthor({
            name: "무작위 총력전",
            url: "https://www.op.gg/modes/aram"
        })
        .setTitle(`${getTierEmoji(championInfo.championTier)} ${getChampionEmoji(engChampionName)} ${krChampionName} \u200B \u200B \u200B \u200B ${championInfo.championWinRate}`)
        .setURL(`https://www.op.gg/modes/aram/${engChampionName}/skills?region=${info.region}&tier=${info.tier}&patch=${info.patch}`)
        .setColor("#00b0f4")

        for (let build of skillList) {
            let skill = build.skill;
            let value = `\u200B **${skill[0]}** \u200B > \u200B **${skill[1]}** \u200B > \u200B **${skill[2]}** \u200B \u200B \u200B \u200B \u200B \u200B \u200B`
            value += `\n\n**승률** \`${build.skillWinRate}\`\n픽률 \`${build.skillPickRate}\`\n게임 \`${build.skillGameCnt}\``;
            embed.addFields({
                name: `${getSkillEmoji(engChampionName, skill[0])} > ${getSkillEmoji(engChampionName, skill[1])} > ${getSkillEmoji(engChampionName, skill[2])}`,
                value: value,
                inline: true
            })
        }

        console.timeEnd("칼바람스킬");
        return interaction.reply({ embeds : [embed] });
    },

    async getSkillAram(engChampionName) {
        const URL = `https://www.op.gg/modes/aram/${engChampionName}/skills?region=${info.region}&tier=${info.tier}&patch=${info.patch}`;

        try {
            const res = await axios.get(URL);
            const $ = cheerio.load(res.data);
            const championInfo = await getChampionInfo($);

            // skill containers
            const skillContainer = $('#content-container > main > div.css-pa089l.eff3mnm0 > div > section.css-1h9aazs.eg9r4ft0 > ul > li').toArray();
            // 내림차순 정렬
            const sortSkillList = skillContainer.sort((a, b) => {
                const valueA = parseFloat($(a).children('div > span.win-rate > em').text().trim());
                const valueB = parseFloat($(b).children('div > span.win-rate > em').text().trim());
                return valueB - valueA;
            })
            // 스킬 빌드를 저장할 배열
            let skillList = [];
            // 배열에 저장할 스킬 빌드의 수
            const skillListLength = 3;
            for (let i=0; i<skillListLength; i++) {
                let el = sortSkillList[i];
                let skill = $(el).find('div > div > div > div > div > div').map((_, img) => $(img).text().trim()).get();
                let skillWinRate = $(el).find('div > span.win-rate > em').text().trim();
                let skillPickRate = $(el).find('div > span.pick-rate').contents().filter(function () { return this.type === "text"; }).text().trim();
                let skillGameCnt = $(el).find('div > span.pick-rate > small').contents().first().text().trim();
                skillList.push({
                    skill : skill,
                    skillWinRate : skillWinRate,
                    skillPickRate : skillPickRate,
                    skillGameCnt : skillGameCnt,
                })
            }
            console.log(skillList);

            return { championInfo, skillList };
        } catch (error) {
            console.error("❌ 데이터 가져오기 실패:", error.message);
        }
    }
};