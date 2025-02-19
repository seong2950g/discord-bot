const queueManager = require("./queue.js");
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ 일시정지된 음악을 다시 재생합니다.'),
    async execute(interaction) {
        const serverQueue = queueManager.getQueue(interaction.guild.id);
        if (!serverQueue || serverQueue.playing) {
            return interaction.reply("❌ 일시정지된 음악이 없습니다!");
        }

        // ▶ 음악 다시 재생
        if (serverQueue.player) {
            serverQueue.player.unpause();
            serverQueue.playing = true;
            interaction.reply("▶️ 음악을 다시 재생합니다!");
        } else {
            interaction.reply("❌ 음악을 다시 재생할 수 없습니다.");
        }
    },
};