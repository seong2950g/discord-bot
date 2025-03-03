const queueManager = require("./queue.js");
const embedManager = require('./musicEmbed.js');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ 일시정지된 음악을 다시 재생합니다.'),
    async execute(interaction) {
        const serverQueue = queueManager.getQueue(interaction.guild.id);
        if (!serverQueue || serverQueue.playing) {
            return interaction.reply({ content: '❌ 일시정지된 음악이 없습니다!', flags: MessageFlags.Ephemeral });
        }

        if (serverQueue.player) {
            serverQueue.player.unpause();
            serverQueue.playing = true;
            const updatedEmbed = await embedManager.getUpdatedEmbed(interaction, '재생 중');
            
            return interaction.update({embeds: [updatedEmbed]});
        } else {
            interaction.reply({ content: '❌ 음악을 다시 재생할 수 없습니다.', flags: MessageFlags.Ephemeral });
        }
    },
};

