const queueManager = require('./queue.js');
const { MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    // 뮤직 임베드 생성
    async createMusicEmbed(song, state) {

        let playState;
        switch (state) {
            case 'play' :
                playState = '``재생 중``'
                break;
            case 'loop':
                playState = '``반복 재생 중``'
                break;
        }

        const musicEmbed = new EmbedBuilder()
        .setTitle(`💿 \u200B${song.title}`)
        .setURL(song.url)
        .setThumbnail(song.thumbnail)
        .setColor('#c4302b')
        .addFields({
            name: '곡 길이',
            value: `\`\`${parseInt(song.sec/60)}:${String(song.sec%60).padStart(2, '0')}\`\``,
            inline: true 
        },{
            name: '재생 상태',
            value: playState,
            inline: true
        },{
            name: '\u200B',
            value: '\u200B',
            inline: true
        })
    
        const playButton = new ButtonBuilder()
            .setCustomId('music_resume')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary);
        
        const pauseButton = new ButtonBuilder()
            .setCustomId('music_pause')
            .setEmoji('⏸️')
            .setStyle(ButtonStyle.Secondary);
        
        const stopButton = new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Secondary);
                
        const skipButton = new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary);
    
        const loopButton = new ButtonBuilder()
            .setCustomId('music_loop')
            .setEmoji('🔂')
            .setStyle(state === 'loop' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    
        const buttonRow = new ActionRowBuilder()
            .addComponents(playButton, pauseButton, skipButton, stopButton, loopButton);

        return { musicEmbed, buttonRow };
    },

    // 뮤직 임베드의 재생 상태를 변경
    async getUpdatedEmbed(interaction, state) {
        const oldEmbed = interaction.message.embeds[0];
        if (!oldEmbed) return interaction.reply({ content: '❌ 임베드를 찾을 수 없습니다.', flags: MessageFlags.Ephemeral });

        // ✅ 기존 필드 배열 복사
        const updatedFields = oldEmbed.fields.map(field => 
            field.name === '재생 상태' ? { ...field, value: `\`\`${state}\`\``} : field
        );

         // ✅ 새로운 Embed 생성 (특정 필드만 업데이트)
        const updatedEmbed = EmbedBuilder.from(oldEmbed).setFields(updatedFields);

        return updatedEmbed;
    },

    // 뮤직 임베드의 반복 재생 버튼을 누를 때 버튼 스타일을 변경
    async getUpdatedButtonRow(interaction) {
        const serverQueue = queueManager.getQueue(interaction.guild.id);
        const updatedRows = interaction.message.components.map(row => {
            return new ActionRowBuilder().addComponents(
                row.components.map(button =>
                    new ButtonBuilder()
                        .setCustomId(button.customId)
                        .setEmoji(button.emoji)
                        .setStyle(serverQueue.loop && button.customId === interaction.customId ? ButtonStyle.Primary : ButtonStyle.Secondary)
                )
            )
        });
        
        return updatedRows;
    },

    // 뮤직 임베드의 모든 버튼을 비활성화
    async getDisabledButtonRow(interaction) {
        const updatedRows = interaction.message.components.map(row => {
            return new ActionRowBuilder().addComponents(
                row.components.map(button =>
                    new ButtonBuilder()
                        .setCustomId(button.customId)
                        .setEmoji(button.emoji)
                        .setStyle(button.style)
                        .setDisabled(true)
                )
            )
        });
        
        return updatedRows;
    }
};

