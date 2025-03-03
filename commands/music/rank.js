const axios = require("axios");
const cheerio = require("cheerio");
const { SlashCommandBuilder, MessageFlags, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const GENRE = {
    'com' : 'GN0000',
    'domestic' : 'DM0000',
    'abroad' : 'AB0000',
    'ballad' : 'GN0100',
    'dance' : 'GN0200',
    'rap' : 'GN0300',
    'rnb' : 'GN0400',
    'indie' : 'GN0500',
    'rock' : 'GN0600',
    'folk' : 'GN0800',
    'jpop' : 'GN1900',
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('멜론 뮤직 탑 50 리스트를 보여줍니다. 리스트의 노래를 선택하여 재생할 수 있습니다.'),
    async execute(interaction) {
        let URL = 'https://www.melon.com/chart/index.htm'; //기본 TOP 50 링크

        let buttonRows;
        // ✅ `rank.js`에서 Button을 선택한 경우
        if (interaction.isButton()) {
            await interaction.deferUpdate();
            const clickButtonId = interaction.customId;
            //console.log(clickButtonId);
            let chartButtonId = await getChartButtonId(interaction);
            let genreButtonId = await getGenreButtonId(interaction);
            //console.log(chartButtonId, genreButtonId);
            //console.log(clickButtonId);

            //URL 생성 로직
            if (clickButtonId === 'music_rank_chart_basic') {
                URL = 'https://www.melon.com/chart/index.htm'
                chartButtonId = clickButtonId;
                genreButtonId = null;
            }
            else if (chartButtonId === 'music_rank_chart_basic') {
                if (clickButtonId.startsWith('music_rank_chart') && !genreButtonId) {
                    chartButtonId = clickButtonId;
                    genreButtonId = 'music_rank_genre_com';
                    //console.log(1);
                }
                else if (clickButtonId.startsWith('music_rank_genre')) {
                    chartButtonId = 'music_rank_chart_day';
                    genreButtonId = clickButtonId;
                    //console.log(2);
                }
                //console.log(chartButtonId, genreButtonId);
                URL = await createUrl(chartButtonId, genreButtonId)
            }
            else if (clickButtonId.startsWith('music_rank_chart')) {
                chartButtonId = clickButtonId;
                URL = await createUrl(chartButtonId, genreButtonId)
            }
            else if (clickButtonId.startsWith('music_rank_genre')) {
                genreButtonId = clickButtonId;
                URL = await createUrl(chartButtonId, genreButtonId)
            }

            buttonRows = await setButton(interaction, chartButtonId, genreButtonId);
        } else {
            await interaction.deferReply(); // 응답 지연
        }

        //console.log(URL);
        const songList = await getSongList(URL);
        const components = await createSelectMenu(songList, 25);

        if (interaction.isButton()) {
            buttonRows.forEach(row => {
                components.push(row);
            })

            return await interaction.editReply({ 
                content: '**💿 실시간 멜론 뮤직 TOP 50 리스트**\n `리스트에서 노래를 선택하면 재생목록에 넣어드릴게요!`',
                components: components });
            
        } else {
            const { dmwRow, genreRow1, genreRow2, genreRow3 } = await createChangeChartButton();
            components.push(dmwRow);
            components.push(genreRow1);
            components.push(genreRow2);

            return await interaction.editReply({
                content: '**💿 실시간 멜론 뮤직 TOP 50 리스트**\n `리스트에서 노래를 선택하면 재생목록에 넣어드릴게요!`',
                components: components,
            });
        }
    }
};

async function getSongList(URL) {
    const res = await axios.get(URL);
    const $ = cheerio.load(res.data);

    const songContainer = $('#lst50');
    const songList = [];
    $(songContainer).each((_, el) => {
        const rank = $(el).find('td:nth-child(2) > div > span.rank').text();
        const songName = $(el).find('td:nth-child(6) > div > div > div.ellipsis.rank01 > span > a').text();
        const singer = $(el).find('td:nth-child(6) > div > div > div.ellipsis.rank02 > a').text();

        if (rank && songName && singer) {
            songList.push({ rank: parseInt(rank), title: songName, artist: singer})
        }
    });
    return songList;
}

async function createSelectMenu(list, maxElement=10) {
    const components = [];

    for (let i=1; i<= Math.ceil(list.length/maxElement); i++) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`select_song_${i}`)
            .setPlaceholder(`🎵 ${(i-1)*maxElement+1}위 ~ ${i*maxElement}위 노래 보기`)
            .addOptions(
                list.slice((i-1)*maxElement, i*maxElement).map(song => ({
                        label: `${song.rank}위 \u200B ${song.title}`,
                        description: ` \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B \u200B ${song.artist}`,
                        value: JSON.stringify({ title: song.title, artist: song.artist })
                    }))
                );
        const row = new ActionRowBuilder().addComponents(selectMenu);
        components.push(row);
    }
   
    return components
}

async function createChangeChartButton() {
    const top50Button = new ButtonBuilder()
        .setLabel('TOP 50')
        .setCustomId('music_rank_chart_basic')
        .setStyle(ButtonStyle.Primary)
        .setDisabled();

    const dayButton = new ButtonBuilder()
        .setLabel('일간 차트')
        .setCustomId('music_rank_chart_day')
        .setStyle(ButtonStyle.Secondary)
    
    const weekButton = new ButtonBuilder()
        .setLabel('주간 차트')
        .setCustomId('music_rank_chart_week')
        .setStyle(ButtonStyle.Secondary);
    
    const monthButton = new ButtonBuilder()
        .setLabel('월간 차트')
        .setCustomId('music_rank_chart_month')
        .setStyle(ButtonStyle.Secondary);
            
    const genreButton = new ButtonBuilder()
        .setLabel('장르 종합')
        .setCustomId('music_rank_genre_com')
        .setStyle(ButtonStyle.Secondary)

    const dmGenreButton = new ButtonBuilder()
        .setLabel('국내 종합')
        .setCustomId('music_rank_genre_domestic')
        .setStyle(ButtonStyle.Secondary);
    
    const abGenreButton = new ButtonBuilder()
        .setLabel('해외 종합')
        .setCustomId('music_rank_genre_abroad')
        .setStyle(ButtonStyle.Secondary);
    
    const balladGenreButton = new ButtonBuilder()
        .setLabel('발라드')
        .setCustomId('music_rank_genre_ballad')
        .setStyle(ButtonStyle.Secondary);
            
    const danceGenreButton = new ButtonBuilder()
        .setLabel('댄스')
        .setCustomId('music_rank_genre_dance')
        .setStyle(ButtonStyle.Secondary);

    const rapHipGenreButton = new ButtonBuilder()
        .setLabel('랩/힙합')
        .setCustomId('music_rank_genre_rap')
        .setStyle(ButtonStyle.Secondary);
    
    const rnbSoulGenreButton = new ButtonBuilder()
        .setLabel('R&B/Soul')
        .setCustomId('music_rank_genre_rnb')
        .setStyle(ButtonStyle.Secondary);
    
    const indieGenreButton = new ButtonBuilder()
        .setLabel('인디')
        .setCustomId('music_rank_genre_indie')
        .setStyle(ButtonStyle.Secondary);
            
    const rockMetalGenreButton = new ButtonBuilder()
        .setLabel('락/메탈')
        .setCustomId('music_rank_genre_rock')
        .setStyle(ButtonStyle.Secondary);

    const folkBluesGenreButton = new ButtonBuilder()
        .setLabel('포크/블루스')
        .setCustomId('music_rank_genre_folk')
        .setStyle(ButtonStyle.Secondary);

    const jpopGenreButton = new ButtonBuilder()
        .setLabel('J-pop')
        .setCustomId('music_rank_genre_jpop')
        .setStyle(ButtonStyle.Secondary);

    const dmwRow = new ActionRowBuilder().addComponents(top50Button, dayButton, weekButton, monthButton);   
    const genreRow1 = new ActionRowBuilder().addComponents(genreButton, dmGenreButton, abGenreButton);
    const genreRow2 = new ActionRowBuilder().addComponents(balladGenreButton, danceGenreButton, rapHipGenreButton, rnbSoulGenreButton, jpopGenreButton);
    const genreRow3 = new ActionRowBuilder().addComponents(indieGenreButton, rockMetalGenreButton, folkBluesGenreButton);
    return { dmwRow, genreRow1, genreRow2, genreRow3 };
}

async function setButton(interaction, chartButtonId, genreButtonId) {
    const updatedRows = interaction.message.components.slice(2).map(row => {
        return new ActionRowBuilder().addComponents(
            row.components.map(button =>
                new ButtonBuilder()
                    .setCustomId(button.customId)
                    .setLabel(button.label)
                    .setStyle(button.customId === chartButtonId || button.customId === genreButtonId ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(button.customId === chartButtonId || button.customId === genreButtonId)
            )
        );
    });
    return updatedRows;
}

async function createUrl(chartButtonId, genreButtonId) {
    const prefixUrl = 'https://www.melon.com/chart/';
    const suffixUrl = 'index.htm?classCd=';
    const chartUrl = chartButtonId.split('_')[3];
    const genreUrl = genreButtonId.split('_')[3];

    return prefixUrl + chartUrl + '/' + suffixUrl + GENRE[genreUrl];
}

async function getChartButtonId(interaction) {
    const chartButtonRow = interaction.message.components[2];
    for (const button of chartButtonRow.components) {
        if (button?.disabled) {
            return button.customId;
        }
    }
    return null;
}

async function getGenreButtonId(interaction) {
    const buttonRows = interaction.message.components.slice(3, 5);
    for (const row of buttonRows) {
        for (const button of row.components) {
            if (button?.disabled) {
                return button.customId;
            }
        }
    }
    return null;
}