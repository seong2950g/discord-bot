const axios = require("axios");
require("dotenv").config();

module.exports = { searchYouTube };

async function searchYouTube(query) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY; // 🔑 YouTube API 키
        const apiUrl = `https://www.googleapis.com/youtube/v3/search`;

        const response = await axios.get(apiUrl, {
            params: {
                part: "snippet",
                q: query,
                maxResults: 1, // 최대 maxResults개의 검색 결과 가져오기
                type: "video",
                key: apiKey,
            },
        });

        if (!response.data.items.length) return null;

        // 조회수 가져오기 위한 videoId 리스트 추출
        const videoIds = response.data.items.map(item => item.id.videoId).join(",");

        // 🔍 각 비디오의 조회수 가져오기
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos`;
        const videoDetailsResponse = await axios.get(videoDetailsUrl, {
            params: {
                part: "statistics",
                id: videoIds,
                key: apiKey,
            },
        });

        // 📊 조회수가 가장 높은 영상 찾기
        const videos = response.data.items.map((item, index) => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            views: parseInt(videoDetailsResponse.data.items[index]?.statistics?.viewCount || "0", 10),
        }));

        // 🔝 조회수 기준으로 정렬 후 가장 조회수가 높은 영상 반환
        return videos.sort((a, b) => b.views - a.views)[0];
    } catch (error) {
        console.error("❌ YouTube 검색 오류:", error);
        return null;
    }
}