const queueManager = require("./queue.js");
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('📜 현재 음악 대기열 정보를 확인합니다.'),
    async execute(interaction) {
        const queueText = queueManager.toString(interaction.guild.id);
        return interaction.reply(queueText);
    },
};