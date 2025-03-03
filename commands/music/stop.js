const { SlashCommandBuilder, MessageFlags, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('음악을 종료, 대기열을 삭제하고 봇이 퇴장합니다.'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply({ content: '❌ 음성 채널에 있어야 합니다!', flags: MessageFlags.Ephemeral });
            return;
        }

        const stopModal = await createStopModal();
        return interaction.showModal(stopModal);
    },
};

async function createStopModal() {
    const confirmModal = new ModalBuilder()
        .setCustomId('music_stop_modal')
        .setTitle("재생 중지 및 대기열 삭제");

    const confirmInput = new TextInputBuilder()
        .setCustomId('music_stop_confirm')
        .setLabel("'정지'를 입력해주세요.")
        .setStyle(TextInputStyle.Short);

    const fActionRow = new ActionRowBuilder().addComponents(confirmInput);
    confirmModal.addComponents(fActionRow);

    return confirmModal;
}
