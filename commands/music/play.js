const { 
    joinVoiceChannel, // 봇이 음성 채널에 들어가기 위한 함수
    createAudioPlayer, // 오디오 플레이어를 생성하는 함수
    createAudioResource, // 스트리밍 된 오디오 데이터를 음성 채널에서 재생 가능하도록 변환하는 함수
} = require("@discordjs/voice");
const ytdl = require("@distube/ytdl-core");
const queueManager = require('./queue.js');
const embedManager = require('./musicEmbed.js');
const yt = require('../../utils/youtubeSearch.js');
const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('▶️ 음악을 재생합니다.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('🔎🌐 검색어 또는 URL을 입력하세요.')
				.setRequired(true)),
	async execute(interaction) {
        await interaction.deferReply();

        let userInput;
         // `/play`로 명령어를 실행한 경우
        if (interaction.isChatInputCommand()) {
            userInput = interaction.options.getString('input');
        }
        // `rank.js`에서 Select Menu로 선택한 경우
        else if (interaction.isStringSelectMenu()) {
            const songData = JSON.parse(interaction.values[0]);
            userInput = songData.title + songData.artist;
        }
        
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

        let songInfo;
        try {
            songInfo = await ytdl.getInfo(videoUrl);
        } catch (error) {
            console.error("❌ 유튜브 정보를 가져오는 중 오류 발생:", error);
            return interaction.editReply({ content: '❌ 유튜브 정보를 불러오는 중 오류가 발생했습니다.', flags: MessageFlags.Ephemeral })
        }
        
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
                return await interaction.editReply(`▶️ **${song.title}**(을)를 재생합니다!`)
            } else {
                const listCommander = require('./list.js');
                return await listCommander.execute(interaction);
            }
           
        } catch (error) {
            console.error("❌ 음악 재생 중 오류 발생:", error);
            return interaction.reply("❌ 음악을 재생할 수 없습니다!");
        }
	},
}

async function playSong(interaction, serverQueue) {
    if (!serverQueue.loop && serverQueue.songs.length === 0) {
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

    let song;
    // 반복 재생 및 스킵 확인
    if (serverQueue.skipFlag) {
        song = queueManager.nextSong(interaction.guild.id);
    }
    else if (serverQueue.loop) {
        song = serverQueue.recentSong;
    } else {
        song = queueManager.nextSong(interaction.guild.id);
    }
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

    const { musicEmbed, buttonRow } = await embedManager.createMusicEmbed(song, serverQueue.loop ? 'loop' : 'play');
    
    if (serverQueue.skipFlag || !serverQueue.loop) {
        const lastEmbed = await interaction.channel.send({ embeds: [ musicEmbed ], components: [ buttonRow ]});
        serverQueue.lastMessage = lastEmbed;
    } else {
        console.log('음악 반복 재생 중');
    }

    // ▶️ 오디오 플레이어 재생
    serverQueue.player.play(resource);
    serverQueue.playing = true;
    serverQueue.recentSong = song;
    serverQueue.skipFlag = false;


    // 음악이 끝나면 다음 곡 재생 or 연결 종료
    serverQueue.player.removeAllListeners('idle'); // 🔥 중복 이벤트 방지
    serverQueue.player.on("idle", async () => {
        // 반복 재생중인 상태거나, 대기열에 곡이 있다면 재생
        if (serverQueue.loop) {
            playSong(interaction, serverQueue);
        } else if (serverQueue.songs.length > 0) {
            await musicPlayComplete(interaction, serverQueue);
            await playSong(interaction, serverQueue);
        } else {
            await musicPlayComplete(interaction, serverQueue);
            // ✅ 이미 `VoiceConnection`이 종료되었는지 확인 후 `destroy()` 호출
            if (serverQueue.connection) {
                serverQueue.connection.destroy();
            }
            queueManager.deleteQueue(interaction.guild.id);
        }
    });
}

// 음악 재생을 완료하면 임베드의 재생 상태를 재생 완료로 변경
async function musicPlayComplete(interaction, serverQueue) {
    if (!serverQueue.lastMessage) return;

    const oldEmbed = serverQueue.lastMessage.embeds[0];
    if (!oldEmbed) return;

    // ✅ 기존 필드 배열 복사
    const updatedFields = oldEmbed.fields.map(field => 
        field.name === '재생 상태' ? { ...field, value: `\`\`재생 완료\`\``} : field
    );

     // ✅ 새로운 Embed 생성 (특정 필드만 업데이트)
    const updatedEmbed = EmbedBuilder.from(oldEmbed).setFields(updatedFields);

    await serverQueue.lastMessage.edit({embeds: [updatedEmbed]});

    // ✅ 새로운 비활성화 버튼 생성
    const updatedRows = serverQueue.lastMessage.components.map(row => {
        return new ActionRowBuilder().addComponents(
            row.components.map(button =>
                new ButtonBuilder()
                    .setCustomId(button.customId)
                    .setEmoji(button.emoji)
                    .setStyle(button.style)
                    .setDisabled(true)
            )
        )
    });

    await serverQueue.lastMessage.edit({components: updatedRows});
}



