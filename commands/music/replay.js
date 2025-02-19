const queueManager = require("./queue.js");
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('(미개발) ↩️▶️ 이전에 재생했던 곡을 다시 재생합니다.'),
    async execute(interaction) {
        
        return interaction.reply();
    },
};