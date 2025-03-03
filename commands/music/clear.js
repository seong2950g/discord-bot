const { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('🗑️ 현재 음악 리스트를 삭제 합니다.'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply({ content: '❌ 음성 채널에 있어야 합니다!', flags: MessageFlags.Ephemeral });
            return;
        }

        const clearModal = await createClearModal();
        return interaction.showModal(clearModal);
    },
};

async function createClearModal() {
    const confirmModal = new ModalBuilder()
        .setCustomId('music_clear_modal')
        .setTitle("음악 대기열 삭제 확인");

    const confirmInput = new TextInputBuilder()
        .setCustomId('music_clear_confirm')
        .setLabel("대기열을 삭제하시려면 '삭제'를 입력해주세요.")
        .setStyle(TextInputStyle.Short);

    const fActionRow = new ActionRowBuilder().addComponents(confirmInput);
    confirmModal.addComponents(fActionRow);

    return confirmModal;
}

