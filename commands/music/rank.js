const axios = require("axios");
const cheerio = require("cheerio");
const { SlashCommandBuilder } = require('discord.js');

const URL = 'https://www.melon.com/chart/index.htm'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('(미개발) 멜론 뮤직 탑 50 리스트를 보여줍니다.'),
    async execute(interaction) {
        const res = await axios.get(URL);
        const $ = cheerio.load(res.data);
        
        const songs = $('#lst50');
        $(songs).each((_, el) => {
            const rank = $(el).find('td:nth-child(2) > div > span.rank').text();
            const songName = $(el).find('td:nth-child(6) > div > div > div.ellipsis.rank01 > span > a').text();
            const singer = $(el).find('td:nth-child(6) > div > div > div.ellipsis.rank02 > a').text();

            console.log(`${rank}위: ${songName} - ${singer}`);
        });
    }
};