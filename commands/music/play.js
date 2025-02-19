const { 
    joinVoiceChannel, // 봇이 음성 채널에 들어가기 위한 함수
    createAudioPlayer, // 오디오 플레이어를 생성하는 함수
    createAudioResource // 스트리밍 된 오디오 데이터를 음성 채널에서 재생 가능하도록 변환하는 함수
} = require("@discordjs/voice");
const ytdl = require("@distube/ytdl-core");
const queueManager = require('./queue.js');
const yt = require('../../utils/youtubeSearch.js');
const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('▶️ 음악을 재생합니다.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('🔎🌐 검색어 또는 URL을 입력하세요.')
				.setRequired(true)),
	async execute(interaction) {
        await interaction.deferReply(); // 응답 지연
        const userInput = interaction.options.getString('input');
        
        // 명령을 요청한 유저가 속한 음성 채널
        const voiceChannel = interaction.member.voice.channel; 
        if (!voiceChannel) return interaction.editReply({ content: '🔉👥 음성 채널에 접속 후, 노래를 재생하세요.', flags: MessageFlags.Ephemeral });

        // user의 입력이 유튜브 URL이 아닌 경우, 
        if (!ytdl.validateURL(userInput)) {
            // 유튜브로 검색해서 조회수가 가장 높은 영상 정보 반환
            const searchResult = await yt.searchYouTube(userInput);
            if (!searchResult) return interaction.editReply({ content: '🔎❌ 검색 결과가 없습니다.', flags: MessageFlags.Ephemeral });
            videoUrl = searchResult.url;
        }

        const songInfo = await ytdl.getInfo(videoUrl);
        const song = { 
            title: songInfo.videoDetails.title,
            url: videoUrl, 
            thumbnail: songInfo.videoDetails.thumbnails.pop().url,
            artist: songInfo.videoDetails.author.name,
            duration: songInfo.videoDetails.lengthSeconds * 1000,
            sec : songInfo.videoDetails.lengthSeconds,
            viewCount : songInfo.videoDetails.viewCount,
            position: 0, // 시작 시간 (0초)
        };

        try {
            //길드(서버)의 음악 대기열 큐를 가져옴
            const serverQueue = queueManager.getQueue(interaction.guild.id);
            queueManager.addSong(interaction.guild.id, song);
            if (!serverQueue.playing) {
                playSong(interaction, serverQueue);
                await interaction.editReply(`▶️ **${song.title}**을(를) 재생합니다!`);
            } else {
                await interaction.editReply(`✅ **${song.title}**(이)가 대기열에 추가되었습니다!`);
            }
           
        } catch (error) {
            console.error("❌ 음악 재생 중 오류 발생:", error);
            interaction.reply("❌ 음악을 재생할 수 없습니다!");
        }
	},
};

async function playSong(interaction, serverQueue) {
    if (serverQueue.songs.length === 0) {
        queueManager.clearQueue(interaction.guild.id);
        return;
    }

    if (!serverQueue.connection) {
        // 🎧 음성 채널 연결
        serverQueue.connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId, //명령어를 요청한 멤버가 위치하고 있는 채널 id
            guildId: interaction.guild.id,  //길드(서버) id
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
    }

    // 대기열에서 다음 곡 정보 가져오기
    const song = queueManager.nextSong(interaction.guild.id);
    if (!song) return;
    
    // 오디오스트림 가져오기 (`@distube/ytdl-core` 사용)
    const stream = await ytdl(song.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25 });
    
    // YouTube스트림을 Discord에서 재생할 수 있는 오디오리소스로 변환
    const resource = createAudioResource(stream);

    if (!serverQueue.player) {
        // ▶️ 오디오 플레이어 생성
        serverQueue.player = createAudioPlayer();
        serverQueue.connection.subscribe(serverQueue.player);
    }

    // ▶️ 오디오 플레이어 재생
    serverQueue.player.play(resource);
    //message.channel.send(`🎶 **${song.title}**을(를) 재생합니다!`);

    const musicEmbed = await createMusicEmbed(interaction, song);
    interaction.channel.send({ embeds: [ musicEmbed ]});
    serverQueue.playing = true;

    // 오디오 플레이어가 idle 상태이면 실행되는 함수
    serverQueue.player.on("idle", () => {
        if (serverQueue.songs.length > 0){
            // 대기열에 곡이 있다면 재생
            playSong(interaction, serverQueue);
        } else {
            serverQueue.connection.destroy();
            queueManager.deleteQueue(interaction.guild.id);
        }
    });
}

async function createMusicEmbed(interaction, song) {
    const musicEmbed = new EmbedBuilder()
    .setTitle(song.title)
    .setURL(song.url)
    .setDescription(`곡 길이 : \`\`${parseInt(song.sec/60)}:${song.sec%60}\`\``)
    .setImage(song.thumbnail)
    .setColor('#c4302b')
    return musicEmbed;
}
