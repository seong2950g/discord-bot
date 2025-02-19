const queueManager = require('./queue.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('🗑️ 현재 음악 리스트를 삭제 합니다.'),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const serverQueue = queueManager.getQueue(guildId);

        if (!serverQueue || serverQueue.songs.length === 0) {
            return interaction.reply("❌ 대기중인 노래가 없습니다.");
        }

        // 현재 음악 대기 리스트 초기화
        serverQueue.songs = []
        return interaction.reply("🗑️ 음악 리스트를 삭제했어요.");
    },
};
