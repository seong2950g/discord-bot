const queueManager = require('./queue.js');
const embedManager = require('./musicEmbed.js');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭ 현재 음악을 건너뛰고 다음 곡을 재생합니다.'),
    async execute(interaction) {
        const serverQueue = queueManager.getQueue(interaction.guild.id);

        serverQueue.player.stop();
        serverQueue.playing = false;
        serverQueue.skipFlag = true;

        await interaction.deferUpdate();
        const updatedEmbed = await embedManager.getUpdatedEmbed(interaction, '스킵');
        const updatedRows = await embedManager.getDisabledButtonRow(interaction);
        await interaction.editReply({embeds: [updatedEmbed], components: updatedRows});

    },
};