const queueManager = require("./queue.js");
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸ 현재 재생중인 음악을 일시정지합니다.'),
    async execute(interaction) {
        const serverQueue = queueManager.getQueue(interaction.guild.id);
        if (!serverQueue || !serverQueue.playing) {
            return interaction.channel.send("❌ 현재 재생 중인 음악이 없습니다!");
        }

        // ⏸ 음악 일시정지
        if (serverQueue.player) {
            serverQueue.player.pause();
            serverQueue.playing = false;
            interaction.reply("⏸ 음악을 일시정지했습니다!");
        } else {
            interaction.reply("❌ 음악을 일시정지할 수 없습니다.");
        }
    },
};