

module.exports = {
    async execute(interaction) {

        try {
            // 가위바위보 게임 버튼
            if (interaction.customId.startsWith('game_rps')) {
                const userState = interaction.customId
                

            }
        } catch (error) {
            console.error('❌ 버튼 클릭 처리 중 오류 발생:', error);
        }
    }
};