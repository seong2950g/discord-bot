const { Events, ActivityType, PresenceUpdateStatus } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		client.user.setPresence({
			status: PresenceUpdateStatus.Online, // online 상태로 설정
			activities: [
				{
					name: "자는 중...zZZ",
					type: ActivityType.Custom,
				},
			],
		});
	},
};