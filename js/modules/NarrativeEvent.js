class NarrativeEvent {
    constructor() {
        this.currentEvent = null;
    }

    async triggerCrisis(idolId, provider, service) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return null;

        const systemPrompt = `
            Bạn là AI Biên kịch của Game "Muse Architect". 
            Idol: ${idol.name}, Phong cách: ${idol.concept}. 
            Chỉ số hiện tại: Fame ${idol.stats.fame}, Visual ${idol.stats.visual}, Risk ${idol.stats.scandal_risk}.

            Tình huống: Tạo 1 tình huống khủng hoảng sau sự kiện (tiếng Việt).
            TRẢ VỀ JSON CHUẨN:
            {
                "scenario": "Mô tả tình huống...",
                "choices": [
                    {"text": "Lựa chọn 1", "impact": {"fame": 10, "risk": 5}},
                    {"text": "Lựa chọn 2", "impact": {"fame": -10, "risk": -15}},
                    {"text": "Lựa chọn 3", "impact": {"fame": 0, "risk": 10}}
                ]
            }
        `;

        try {
            const response = (provider === 'gemini') ? await service.generateContent(systemPrompt) : await service.generateText(systemPrompt);
            const jsonStr = cardEngine._extractJSON(response);
            if (jsonStr) return JSON.parse(jsonStr);
        } catch (e) { console.error("Narrative Error:", e); }
        return null;
    }
}
const narrativeEvent = new NarrativeEvent();
