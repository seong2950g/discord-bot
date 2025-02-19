const queueManager = require('./queue.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ 현재 재생중인 음악 재생을 종료합니다.'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply('❌ 음성 채널에 있어야 합니다!');
        }


        const serverQueue = queueManager.getQueue(interaction.guild.id);
        if (serverQueue.player) {
            const connection = getVoiceConnection(interaction.guild.id);
            if (connection) {
                connection.destroy();
            }
            serverQueue.player.stop()
            serverQueue.playing = false;
            queueManager.deleteQueue(interaction.guild.id);
            return interaction.reply('⏹ 음악 재생을 중지합니다.');
        } else {
            return interaction.reply('❌ 현재 재생 중인 음악이 없습니다.');
        }
    },
};