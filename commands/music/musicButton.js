const queueManager = require('./queue.js');
const queueCommand = require('./list.js');
const embedManager = require('./musicEmbed.js');
const { MessageFlags } = require('discord.js');

module.exports = {
    async execute(interaction) {
        try {
            const serverQueue = queueManager.getQueue(interaction.guild.id);
            if (!serverQueue) return;

            // 음악 대기열의 페이지 이동 버튼 처리
            if (interaction.customId.startsWith('music_queue')) {
                await interaction.deferUpdate(); // ✅ 기존 메시지를 유지하면서 업데이트 가능하도록 설정
                const [action, currentPage] = interaction.customId.split('_').slice(2);
            
                let newPage = parseInt(currentPage);
        
                if (action === 'prev') newPage--;
                if (action === 'next') newPage++;
                return queueCommand.create(interaction, serverQueue, newPage);
            }

            // 음악 임베드의 반복 재생 버튼 처리
            else if (interaction.customId === 'music_loop') {
                await interaction.deferUpdate(); 
                serverQueue.loop = !serverQueue.loop;
                
                const updatedEmbed = await embedManager.getUpdatedEmbed(interaction, serverQueue.loop ? '반복 재생 중' : '재생 중');
                const updatedRows = await embedManager.getUpdatedButtonRow(interaction);
            
                await interaction.editReply({embeds: [updatedEmbed], components: updatedRows});
            }

            // 음악 임베드의 resume, pause, skip, stop 버튼 처리
            else {
                const commandName = interaction.customId.split('_')[1];
                try {
                    const musicCommand = require(`./${commandName}.js`);
                    return musicCommand.execute(interaction);
                } catch (error) {
                    console.error(`❌ ${commandName}.js 파일을 불러오는 데 실패했습니다:`, error);
                    return interaction.reply({ content: `❌ '${commandName}' 명령어를 찾을 수 없습니다.`, flags: MessageFlags.Ephemeral });
                }
 
            }

        } catch (error) {
            console.error('❌ 버튼 클릭 처리 중 오류 발생:', error);
        }
    }
};

