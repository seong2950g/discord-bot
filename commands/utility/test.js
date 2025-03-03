const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, Events,
    ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('test'),
	async execute(interaction) {

	},
};

