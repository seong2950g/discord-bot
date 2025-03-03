const queueManager = require("./queue.js");
const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('📜 현재 음악 대기열 정보를 확인합니다.'),
    async execute(interaction) {
    
        const serverQueue = queueManager.getQueue(interaction.guild.id);
        return this.create(interaction, serverQueue, 1);
    },

    async create(interaction, serverQueue, page) {
        const songsPerPage = 5; // 페이지당 표시할 곡 개수
        const totalPages = serverQueue.songs.length != 0 ? Math.ceil(serverQueue.songs.length / songsPerPage) : 1 ;
        const start = (page - 1) * songsPerPage;
        const end = start + songsPerPage;

        const maxTitleLength = 50;
        const queueList = serverQueue.songs.slice(start, end)
        .map((song, index) => {
            if (song.title.length > maxTitleLength) {
                song.title = song.title.slice(0, 50) + ' ... '   
            }
            return `**${start + index + 1}.** \[${song.title}\](${song.url})`}
        ).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🎵 현재 음악 대기열')
            .setDescription(queueList || '❌ 대기열이 비어 있습니다.')
            .setFooter({ text: `페이지 ${page} / ${totalPages}` });

        if (serverQueue.songs.length > 0) {
            embed.setThumbnail(serverQueue.songs[0].thumbnail);
        }

        // 🎯 페이지 네이션 버튼 생성
        const pageButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`music_queue_prev_${page}`)
                .setLabel('⬅️ 이전')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`music_queue_next_${page}`)
                .setLabel('다음 ➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === totalPages)
            );

        // ✅ 기존 메시지를 덮어쓰기 (새로운 메시지를 생성하지 않음)
        if (interaction.replied || interaction.deferred) {
            return interaction.editReply({ embeds: [embed], components: [pageButtons] });
        } else {
            return interaction.reply({ embeds: [embed], components: [pageButtons] });
        }
    }
};

