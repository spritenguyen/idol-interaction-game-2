class CardEngine {
    constructor() {
        this.roster = new Map();
        this.isInitialized = false;
    }

    async init() {
        try {
            const savedIdols = await dbManager.getAllIdols();
            let validCount = 0;
            let invalidCount = 0;

            if (savedIdols && savedIdols.length > 0) {
                savedIdols.forEach(idol => {
                    if (idol && idol.id && idol.name && idol.stats && typeof idol.stats === 'object') {
                        this.roster.set(idol.id, idol);
                        validCount++;
                        if(typeof gameManager !== 'undefined') {
                            gameManager.checkAchievement('STATS_UPDATE', idol.stats);
                        }
                    } else {
                        invalidCount++;
                    }
                });
            }
            if(typeof gameManager !== 'undefined') gameManager.checkAchievement('ROSTER_UPDATE');
            this.isInitialized = true;
        } catch (e) { console.error("[Cine-Tech] DB Sync Error:", e); }
    }

    async createIdol(id, name, concept, baseStats, bio = "", avatarUrl = null) {
        const offlinePlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjODg4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4Ij5TQ0FOTklORzwvdGV4dD48L3N2Zz4=";
        const idol = { 
            id, name, concept, stats: baseStats, bio,
            avatarUrl: avatarUrl || offlinePlaceholder,
            latestTrend: "Gia nhập công ty giải trí. Chờ đợi cơ hội ra mắt." 
        };
        
        this.roster.set(id, idol);
        await dbManager.saveIdolData(idol);
        
        if(typeof gameManager !== 'undefined') {
            gameManager.checkAchievement('ROSTER_UPDATE');
            gameManager.checkAchievement('STATS_UPDATE', baseStats);
        }
        return idol;
    }

    getIdol(id) { return this.roster.get(id); }
    getAllIdols() { return Array.from(this.roster.values()); }

    addExp(id, expAdded) {
        const idol = this.roster.get(id);
        if (!idol) return false;
        idol.exp = (idol.exp || 0) + expAdded;
        let leveledUp = false;
        while (idol.exp >= 100) {
            idol.level = (idol.level || 1) + 1;
            idol.exp -= 100;
            leveledUp = true;
        }
        return leveledUp;
    }

    updateTotalFame() {
        let totalFame = 0;
        for (const idol of this.roster.values()) {
            totalFame += idol.stats.fame || 0;
            totalFame += (idol.fans || 0) / 1000; // rough translation of fans to fame
        }
        if (typeof gameManager !== 'undefined') {
            gameManager.checkAchievement('STATS_UPDATE', { fame: totalFame });
        }
    }

    async updateAvatar(id, newImageUrl) {
        const idol = this.roster.get(id);
        if (idol) {
            idol.avatarUrl = newImageUrl;
            await dbManager.saveIdolData(idol);
            return true;
        }
        return false;
    }

    _extractJSON(rawText) {
        if (typeof rawText !== 'string' || !rawText) return null;
        let jsonStr = rawText;
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
            jsonStr = match[0];
        } else {
            jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        return jsonStr || null;
    }

	async generateAIModelProfile(query, provider, service) {
        const systemPrompt = `Bạn là một Nhà Tuyển Dụng Tài Năng (Senior Talent Scout) xuất sắc trong ngành giải trí.
Dựa trên yêu cầu: "${query || 'Random High-Fashion Style'}", hãy tìm hoặc tạo ra BẤT KỲ 1 hồ sơ Model/Idol/Talent nào (nam hoặc nữ) phù hợp nhất với mô tả.
Tùy thuộc vào yêu cầu, nội suy ra tiểu sử đặc biệt, chức danh độc đáo, và các chỉ số (Stats) tương đương với mức độ "hiếm" của yêu cầu.

YÊU CẦU BẮT BUỘC: Trả về **DUY NHẤT** một JSON hợp lệ. KHÔNG markdown, KHÔNG dùng \`\`\`json, KHÔNG giải thích.
Cấu trúc JSON chuẩn:
{
    "name": "Tên độc đáo / Biệt danh",
    "gender": "Nam/Nữ",
    "concept": "Phong cách/Nghề nghiệp cụ thể (VD: Nữ thần băng giá, Streamer tài năng...)",
    "bio": "Câu chuyện nền ngắn gọn (Tiếng Việt) nhưng cuốn hút, thể hiện tại sao lại có phong cách này.",
    "stats": {
        "fame": 30, // Điều chỉnh từ 10->90 dựa trên mức độ nổi bật của mô tả
        "visual": 70, // Điều chỉnh từ 50->100 dựa trên mô tả
        "scandal_risk": 15 // Rủi ro scandal (từ 5 đến 80)
    },
    "mood": "Bình thường",
    "measurements": {
        "height": "1m70",
        "weight": "50kg",
        "bust": "88",
        "waist": "60",
        "hips": "90"
    },
    "traits": ["Ví dụ: Lạnh lùng", "Thích mèo", "Cầu toàn"],
    "skills": {
        "catwalk": 1,
        "acting": 1,
        "communication": 1
    }
}`;

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("API Timeout")), 20000)
        );

        try {
            const fetchPromise = (provider === 'gemini') ? service.generateContent(systemPrompt, { json: true }) : service.generateText(systemPrompt);
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            const jsonStr = this._extractJSON(response);
            
            if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (!data.name || !data.stats) throw new Error("Dữ liệu AI trả về thiếu trường bắt buộc (Name/Stats).");
                return {
                    id: 'id_' + Date.now(),
                    name: data.name, concept: data.concept, bio: data.bio, stats: data.stats,
                    gender: data.gender || "Nữ", level: data.level || 1,
                    mood: data.mood || "Bình thường", measurements: data.measurements || {height: "?", weight: "?", bust: "?", waist: "?", hips: "?"},
                    affinity: data.affinity || 30, stress: data.stress || 0,
                    traits: data.traits || ["Khó đoán"],
                    skills: data.skills || { catwalk: 1, acting: 1, communication: 1, singing: 1, dancing: 1 }
                };
            }
            throw new Error("Không thể trích xuất JSON từ phản hồi của AI.");
        } catch (e) {
            console.warn("Scout Error/Timeout:", e);
            throw e; // Bubble up
        }
        return null;
    }

    async finalizeIdolRecruitment(tempData) {
        const newIdol = await this.createIdol(tempData.id, tempData.name, tempData.concept, tempData.stats, tempData.bio);
        // Copy measurements and mood over
        newIdol.measurements = tempData.measurements;
        newIdol.mood = tempData.mood;
        newIdol.affinity = tempData.affinity || 30;
        newIdol.stress = tempData.stress || 0;
        await dbManager.saveIdolData(newIdol);

        const avatarPrompt = `Professional square headshot portrait of ${tempData.name}, ${tempData.concept}, high-fashion editorial, cinematic lighting, shot on Hasselblad 85mm, extremely detailed, clean background.`;
        
        pollinationsService.generateImage(avatarPrompt).then(async (avatarUrl) => {
            if (avatarUrl) {
                await this.updateAvatar(tempData.id, avatarUrl);
                if (typeof gameApp !== 'undefined') gameApp.renderCards();
            }
        }).catch(err => console.warn("[Cine-Tech] Lỗi chụp Avatar tự động."));

        return newIdol;
    }

    async deleteIdol(id) {
        if (this.roster.has(id)) {
            this.roster.delete(id);
            return await dbManager.deleteIdolData(id);
        }
        return false;
    }

    async updateIdolTrend(id, provider, service) {
        const idol = this.roster.get(id);
        if (!idol) return null;

        const prompt = `Phân tích biến động thị trường cho: "${idol.name}". Stats: Fame(${idol.stats.fame}), Visual(${idol.stats.visual}), Risk(${idol.stats.scandal_risk}). 
        Tạo 1 sự kiện trend (tiếng Việt). JSON: {"new_stats": {"fame": X, "visual": Y, "scandal_risk": Z}, "trend_reason": "..."}`;

        try {
            let res = (provider === 'gemini') ? await service.generateContent(prompt) : await service.generateText(prompt);
            const json = JSON.parse(this._extractJSON(res));
            
            idol.stats = json.new_stats;
            idol.latestTrend = json.trend_reason;
            
            await dbManager.saveIdolData(idol);
            if(typeof gameManager !== 'undefined') gameManager.checkAchievement('STATS_UPDATE', idol.stats);
            return idol;
        } catch (e) { return null; }
    }
}
const cardEngine = new CardEngine();
