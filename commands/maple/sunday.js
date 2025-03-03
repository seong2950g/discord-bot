const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('썬데이')
        .setDescription('🌞 최근 썬데이 메이플 정보를 제공합니다.'),
    async execute(interaction) {
        const URL = 'https://maplestory.nexon.com/News/Event/Ongoing'
        
        try {
        
            const res = await axios.get(URL);
            const $ = cheerio.load(res.data);
            const eventList = $('#container > div > div.contents_wrap > div.event_board > ul > li > div > dl > dd.data > p > a');
            for (el of eventList) {
                if ($(el).children('em').text().trim().includes("썬데이")) {
                    const eventLink = $(el).attr('href');
                    const suf = eventLink.split('/').pop()
                    const eventUrl = URL + '/' + suf;
                    //console.log(eventUrl);
                    const eventLes = await axios.get(eventUrl);
                    const $e = cheerio.load(eventLes.data);

                    const sundayUrl = $e('#container > div > div.contents_wrap > div.qs_text > div > div:nth-child(1) > div > img').attr('src');
                    return interaction.reply(sundayUrl);
                }
                //console.log(`이벤트 : ${eventName}`)
            }
        
            const URL2 = 'https://maplestory.nexon.com/News/Event/Closed'
            const res2 = await axios.get(URL2);
            const $2 = cheerio.load(res2.data);
            const eventList2 = $2('#container > div > div.contents_wrap > div.event_board > ul > li > div > dl > dd.data > p > a')
            for (el of eventList2) {
                if ($2(el).children('em').text().trim().includes("썬데이")) {
                    const link = $2(el).attr('href');
                    //console.log(link);
                    const suffix = link.split('/').pop()
                    
                    const URL3 = URL2 + '/' + suffix;
                    //console.log(URL3);
                    const res3 = await axios.get(URL3);
                    const $3 = cheerio.load(res3.data);

                    const sundayUrl = $3('#container > div > div.contents_wrap > div.qs_text > div > div:nth-child(1) > div > img').attr('src');
                    //console.log(sundayUrl);
                    return interaction.reply(sundayUrl);
                }
            }

        } catch {

        }
        
    },
};