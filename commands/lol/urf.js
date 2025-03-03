const item = require("./itemUrf");
const skill = require("./skillUrf");
const spell = require("./spellUrf");
const tier = require("./tierUrf");
const rune = require("./runeUrf");
const trans = require("./utils/trans.js");
const info = require("./utils/info.js");
const { getChampionEmoji, getSpellEmoji, getSkillEmoji, getTierEmoji, getItemEmoji } = require("./utils/lolEmoji.js");
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('우르프')
		.setDescription('우르프 추천 종합 정보를 제공합니다.')
		.addStringOption(option =>
			option.setName('kr-champion-name')
				.setDescription('챔피언 이름을 입력하세요.')
				.setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply(); // 응답 지연
        const krChampionName = interaction.options.getString('kr-champion-name', true).trim();
        if (!trans.isValidChampionName(krChampionName)) return interaction.reply("❌ 유효하지 않은 챔피언 이름입니다.");

        const engChampionName = trans.nameKrToEng(krChampionName);
        const URL = `https://www.op.gg/modes/urf/${engChampionName}/build?region=${info.region}&tier=${info.tier}&patch=${info.patch}`;

        const { _, attachment, runeWinRate, runePickRate, runeGameCnt }  = await rune.getRuneUrf(engChampionName);
        const { __, coreBuildList, shoeList, startItemList, itemList } = await item.getItemUrf(engChampionName);
        const { championInfo, skillList} = await skill.getSkillUrf(engChampionName);
        const { ____, spellList } = await spell.getSpellUrf(engChampionName);
        
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
        
        const embed = new EmbedBuilder()
        .setAuthor({
            name: "URF",
            url: "https://www.op.gg/modes/urf",
        })
        .setTitle(`${getTierEmoji(championInfo.championTier)} ${getChampionEmoji(engChampionName)} ${krChampionName} \u200B \u200B \u200B \u200B \u200B${championInfo.championWinRate}`)
        .setURL(URL)
        .addFields({
            name: "**아이템 통계**",
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
            name: "**핵심 빌드**",
            value: coreBuildValue,
            inline: true
        })
        .addFields({
            name: "**시작 아이템**",
            value: startItemValue,
            inline: true
        })
        .addFields({
            name: "**신발**",
            value: shoeValue,
            inline: true
        })
        .setImage("attachment://screenshot.png")
        .setColor("#00b0f4");

        // 스킬 필드 추가
        for (let i=0; i<skillList.length; i++) {
            let info = skillList[i]
            let skill = info.skill;
            let value = `${getSkillEmoji(engChampionName, skill[0])} > ${getSkillEmoji(engChampionName, skill[1])} > ${getSkillEmoji(engChampionName, skill[2])}\n`;
            value += `\u200B **${skill[0]}** \u200B > \u200B **${skill[1]}** \u200B > \u200B **${skill[2]}**`
            value += `\n**승률** \`${info.skillWinRate}\`\n픽률 \`${info.skillPickRate}\`\n게임 \`${info.skillGameCnt}\``;
            embed.addFields({
                name: `**추천 스킬${i+1}**`,
                value: value,
                inline: true
            })
        }
        
        // 스펠 필드 추가
        for (let i=0; i<spellList.length; i++) {
            let info = spellList[i];
            let spell = info.spell;
            let value = `${getSpellEmoji(spell[0])} ${getSpellEmoji(spell[1])}`;
            value += `\n**승률** \`${info.spellWinRate}\`\n픽률 \`${info.spellPickRate}\`\n게임 \`${info.spellGameCnt}\``;
            embed.addFields({
                name: `**추천 스펠${i+1}**`,
                value: value,
                inline: true
            })
        }
        embed.addFields({
            name: '\u200B',
            value: `**룬 정보**\n승률 \`${runeWinRate}\`\n픽률 \`${runePickRate}\`\n게임 \`${runeGameCnt}\``,
            inline: true
        })
        
        return interaction.editReply({ embeds: [embed], files: [attachment] });
    },
   
};