const { Collection } = require("discord.js");

// 서버별 음악 대기열을 저장하는 Map
const queue = new Collection();

module.exports = {
    getQueue(guildId) {
        if (!queue.has(guildId)) {
            queue.set(guildId, {
                songs: [],
                player: null,
                connection: null,
                playing: false
            });
        }
        return queue.get(guildId);
    },

    addSong(guildId, song) {
        // 대기열의 마지막에 하나의 곡 정보를 추가
        const serverQueue = this.getQueue(guildId);
        serverQueue.songs.push(song);
    },

    nextSong(guildId) {
        // 대기열에서 첫번째 곡 정보를 반환하고 대기열에서 삭제
        const serverQueue = this.getQueue(guildId);
        return serverQueue.songs.shift(); 
    },

    clearQueue(guildId) {
        // 현재 길드(서버)의 음악 대기열 초기화
        const serverQueue = this.getQueue(guildId);
        serverQueue.songs = [];
    },

    deleteQueue(guildId) {
        // 현재 길드(서버)의 음악 대기열 삭제
        if (queue.has(guildId)) {
            queue.delete(guildId); 
        }
    },

    toString(guildId) {
        const serverQueue = this.getQueue(guildId);

        if (!serverQueue.songs.length) {
            return "❌ 현재 대기열이 비어 있습니다!";
        }

        let queueList = serverQueue.songs.map((song, index) => {
            return `**${index + 1}.** 🎵 (${parseInt(song.sec/60)}:${song.sec%60}) ${song.title} - [링크](${song.url})`;
        });

        return `📜 **현재 대기열:**\n${queueList.join("\n")}`;
    }
};