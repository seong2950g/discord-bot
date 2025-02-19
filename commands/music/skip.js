const queueManager = require("./queue.js");
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭ 현재 음악을 건너뛰고 다음 곡을 재생합니다.'),
    async execute(interaction) {
        const serverQueue = queueManager.getQueue(interaction.guild.id);

        if (!serverQueue || !serverQueue.songs.length) {
            return interaction.reply("❌ 스킵할 음악이 없습니다!");
        }

        if (serverQueue.player) {
            serverQueue.player.stop();
            return interaction.reply("⏭ 현재 음악을 건너뜁니다.");
        }
    },
};