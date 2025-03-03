const queueManager = require('../commands/music/queue.js');
const embedManager = require('../commands/music/musicEmbed.js');
const musicButtonHandler = require('../commands/music/musicButton');
const { Events, MessageFlags } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// 슬래시 명령 처리
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			// 사용자가 입력한 모든 옵션을 JSON으로 변환하여 로그 출력
            const options = interaction.options.data.map(option => ({ name: option.name, value: option.value }));
			console.log(`${interaction.user.tag}: /${command.data.name} 옵션:`, JSON.stringify(options));

			try {
				await command.execute(interaction);
			} catch (error) {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: '명령어를 실행할 수 없습니다.', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: '명령어를 실행할 수 없습니다.', flags: MessageFlags.Ephemeral });
				}
			}
		}
		// stringSelectMenu 처리
		else if (interaction.isStringSelectMenu()) {
			const songData = JSON.parse(interaction.values[0]);
			// rank.js
			if (interaction.customId.startsWith('select_song')) {
				console.log(`${interaction.user.username}: ${interaction.customId}`);
				console.log(songData);
				const playCommand = require('../commands/music/play');
				return await playCommand.execute(interaction);
			}
		}

		else if (interaction.isButton()) {
			// music 관련 버튼 처리
			if (interaction.customId.startsWith('music_')) {
				console.log(`${interaction.user.username}: music_button - ${interaction.customId}`);
				return musicButtonHandler.execute(interaction);
			}
		}

		// 모달 제출 처리
		else if (interaction.isModalSubmit()) {
			// music 관련 모달 처리
			switch (interaction.customId) {
				// clear.js 모달 처리
				case 'music_clear_modal':
					const confirmClear = interaction.fields.getTextInputValue('music_clear_confirm');

					if (confirmClear === '삭제') {
						const serverQueue = queueManager.getQueue(interaction.guild.id);
						
						if (!serverQueue || serverQueue.songs.length === 0) {
							return interaction.reply({ content: '❌ 대기중인 노래가 없습니다.' , flags: MessageFlags.Ephemeral });
						}
						// 현재 음악 대기 리스트 초기화
						serverQueue.songs = []
						return interaction.reply({ content: '🗑️ 음악 리스트를 삭제했어요.' , flags: MessageFlags.Ephemeral });
					}
					break;
				
				// stop.js 모달 처리
				case 'music_stop_modal':
					const confirmStop = interaction.fields.getTextInputValue('music_stop_confirm');
					if (confirmStop === '정지') {
						try {
							await interaction.deferUpdate();
							const updatedEmbed = await embedManager.getUpdatedEmbed(interaction, '강제 중지');
							const updatedRows = await embedManager.getDisabledButtonRow(interaction);
							await interaction.editReply({embeds: [updatedEmbed], components: updatedRows});
						} catch (error) {
							console.log('?');
						}

						const serverQueue = queueManager.getQueue(interaction.guild.id);
						if (serverQueue) {
							serverQueue.songs = [];
							serverQueue.player?.stop();
							serverQueue.playing = false;
							serverQueue.loop = false;
						}
	
						if (serverQueue.connection) {
							serverQueue.connection.destroy();
						}

						queueManager.deleteQueue(interaction.guild.id);

					} else {
						return interaction.reply({ content: '❌ 입력이 올바르지 않습니다.' , flags: MessageFlags.Ephemeral });
					}
			}
		}
	},
};