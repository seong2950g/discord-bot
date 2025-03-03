const { SlashCommandBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('봇이랑 가위바위보를 해보세요!'),
    async execute(interaction) {
        const rpsButton = createRpsButton();
        interaction.reply({component : [rpsButton]})

    },
};

async function createRpsButton() {
    const pauseButton = new ButtonBuilder()
        .setCustomId('game_rps_rock')
        .setEmoji('✊')
        .setStyle(ButtonStyle.Secondary);
    
    const stopButton = new ButtonBuilder()
        .setCustomId('game_rps_scissor')
        .setEmoji('✌')
        .setStyle(ButtonStyle.Secondary);
            
    const skipButton = new ButtonBuilder()
        .setCustomId('game_rps_paper')
        .setEmoji('✋')
        .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder()
        .addComponents(playButton, pauseButton, skipButton, stopButton);
    return buttonRow
}