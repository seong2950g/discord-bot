const queueManager = require("./queue.js");
const embedManager = require('./musicEmbed.js');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸ 현재 재생중인 음악을 일시정지합니다.'),
    async execute(interaction) {
        const serverQueue = queueManager.getQueue(interaction.guild.id);
        if (!serverQueue || !serverQueue.playing) {
            return interaction.reply({ content: '❌ 현재 재생 중인 음악이 없습니다!' , flags: MessageFlags.Ephemeral });
        }

        if (serverQueue.player) {
            serverQueue.player.pause();
            serverQueue.playing = false;
            const updatedEmbed = await embedManager.getUpdatedEmbed(interaction, '일시 정지');
            
            return interaction.update({embeds: [updatedEmbed]});
        } else {
            interaction.reply({ content: '❌ 음악을 일시 정지할 수 없습니다.', flags: MessageFlags.Ephemeral });
        }
    },
};

