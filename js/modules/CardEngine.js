class CardEngine {
    constructor() {
        this.roster = new Map();
        this.poachedRoster = new Map();
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
                        if (!idol.age) {
                            idol.age = Math.floor(Math.random() * 10) + 18; // 18-27
                            dbManager.saveIdolData(idol);
                        }
                        if (idol.status === 'poached' || idol.status === 'fired') {
                            this.poachedRoster.set(idol.id, idol);
                        } else {
                            this.roster.set(idol.id, idol);
                            validCount++;
                            if(typeof gameManager !== 'undefined') {
                                gameManager.checkAchievement('STATS_UPDATE', idol.stats);
                            }
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

	async generateAIModelProfile(query, tier = 'street') {
        let existingNames = "";
        if (this.roster && this.roster.size > 0) {
            existingNames = Array.from(this.roster.values()).map(idol => idol.name).join(", ");
        }
        
        const tierInstructions = {
            'street': "Họ là gương mặt mới tinh (Tân binh/Amateur), HOÀN TOÀN LÀ NHÂN VẬT HƯ CẤU (Fictional). Các chỉ số (Fame, Visual) chỉ ở mức thấp hoặc trung bình (10-40). Trừ phi nổi bật lắm thì mới Visual cao (50).",
            'pro': "Họ đã có kinh nghiệm chuyên nghiệp. Có thể là NGƯỜI MẪU/KOL NGOÀI ĐỜI THỰC HẠNG TRUNG (Real-life, tỷ lệ 30%) hoặc hư cấu (70%). Chỉ số (Fame, Visual) ở mức khá đến cao (40-75).",
            'global': "Họ phải là SIÊU SAO ĐÌNH ĐÁM QUỐC TẾ, NGƯỜI NỔI TIẾNG HOẶC IDOL CÓ THẬT NGOÀI ĐỜI (Real-life celebrities / super models - ưu tiên 90%). Chỉ số (Fame, Visual) ở mức cực cao (75-100) và câu chuyện phải khớp với đời thực của họ nếu có thật."
        };

        const exactQuery = query || 'Mẫu tự do';
        const exclusionFilter = existingNames ? `\n\nCHÚ Ý QUAN TRỌNG: TRÁNH TẠO RA MODEL TRÙNG TÊN HOẶC TRÙNG LẶP Ý TƯỞNG với các model ĐÃ CÓ ở công ty bao gồm: [${existingNames}]. Bắt buộc phải tạo một người hoàn toàn mới và khác biệt!` : '';

        const systemPrompt = `Bạn là một Nhà Tuyển Dụng Tài Năng (Senior Talent Scout) xuất sắc trong ngành giải trí.
Dựa trên yêu cầu: "${exactQuery}", hãy tìm hoặc tạo ra BẤT KỲ 1 hồ sơ Model/Idol/Talent nào (nam hoặc nữ) phù hợp nhất với phong cách ${tier.toUpperCase()}.
${tierInstructions[tier]}
Trường hợp là nhân vật có thật ngoài đời, HÃY DÙNG TÊN THẬT, tiểu sử, số đo (nếu có thể) và các thông tin phản ánh đúng con người thực của họ.
Tùy thuộc vào yêu cầu, nội suy ra tiểu sử đặc biệt, chức danh độc đáo, và các chỉ số (Stats).${exclusionFilter}

YÊU CẦU BẮT BUỘC: Trả về **DUY NHẤT** một JSON hợp lệ. KHÔNG markdown, KHÔNG dùng \`\`\`json, KHÔNG giải thích, TUYỆT ĐỐI KHÔNG chứa chú thích (//).
Cấu trúc JSON chuẩn:
{
    "name": "Tên độc đáo / Biệt danh",
    "nationality": "Quốc tịch/Vùng lãnh thổ (VD: Vietnamese, Korean, American...)",
    "gender": "Nam/Nữ",
    "age": 20,
    "concept": "Phong cách/Nghề nghiệp cụ thể",
    "isReal": true,
    "bio": "Câu chuyện nền ngắn gọn (Tiếng Việt) nhưng cuốn hút",
    "physicalTraits": "Detailed physical description in English (hair color/style, eye color/shape, facial structure, skin tone, distinctive marks). Mandatory for consistent AI image generation.",
    "stats": {
        "fame": 30,
        "visual": 70,
        "scandal_risk": 15
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
            setTimeout(() => reject(new Error("API Timeout")), 45000)
        );

        try {
            let fetchPromise = apiManager.generateText(systemPrompt);
            let response;
            try {
                response = await Promise.race([fetchPromise, timeoutPromise]);
            } catch (innerError) {
                throw innerError;
            }
            
            const jsonStr = this._extractJSON(response);
            
            if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (!data.name || !data.stats) throw new Error("Dữ liệu AI trả về thiếu trường bắt buộc (Name/Stats).");
                return {
                    id: 'id_' + Date.now(),
                    name: data.name, nationality: data.nationality || "Unknown",
                    concept: data.concept, bio: data.bio, stats: data.stats, isReal: data.isReal || false,
                    age: data.age || 20, gender: data.gender || "Nữ", level: data.level || 1, physicalTraits: data.physicalTraits || "",
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
        newIdol.nationality = tempData.nationality || "Unknown";
        newIdol.measurements = tempData.measurements;
        newIdol.mood = tempData.mood;
        newIdol.isReal = tempData.isReal || false;
        newIdol.physicalTraits = tempData.physicalTraits || "";
        newIdol.age = tempData.age || 20;
        newIdol.affinity = tempData.affinity || 30;
        newIdol.stress = tempData.stress || 0;
        newIdol.scandalRisk = tempData.stats ? (tempData.stats.scandal_risk || 0) : 0;
        newIdol.stats.scandal_risk = newIdol.scandalRisk;
        await dbManager.saveIdolData(newIdol);

        const nat = tempData.nationality && tempData.nationality !== "Unknown" ? tempData.nationality + ' ' : '';
        const ageStr = (tempData.age ? tempData.age + 'yo ' : '');
        const traitStr = tempData.physicalTraits ? ` Facial/Body traits: ${tempData.physicalTraits}.` : '';
        const anatomyOpt = "perfect human anatomy, symmetrical beautiful face, flawless realistic natural eyes, perfect detailed hands and fingers, perfect proportional legs, exactly 5 fingers per hand, masterpiece, photorealistic, 8k. NO deformed, NO bad anatomy, NO bad hands, NO missing fingers, NO extra digits, NO asymmetrical face, NO cross-eyed, NO unnatural body, NO mutated hands";
        const avatarPrompt = `Professional square headshot portrait of a ${ageStr}${nat}model named ${tempData.name}, ${tempData.concept}${traitStr}, high-fashion editorial, cinematic lighting, shot on Hasselblad 85mm, extremely detailed, clean background, ${anatomyOpt}.`;

        pollinationsService.generateImage(avatarPrompt).then(async (avatarUrl) => {
            if (avatarUrl) {
                await this.updateAvatar(tempData.id, avatarUrl);
                if (typeof gameApp !== 'undefined') gameApp.renderCards();
            }
        }).catch(err => console.warn("[Cine-Tech] Lỗi chụp Avatar tự động."));

        return newIdol;
    }

    async deleteIdol(id) {
        // Soft delete or completely remove
        if (this.poachedRoster.has(id)) {
            this.poachedRoster.delete(id);
            return await dbManager.deleteIdolData(id);
        }
        if (this.roster.has(id)) {
            const idol = this.roster.get(id);
            idol.status = 'fired';
            idol.agency = 'none';
            this.roster.delete(id);
            this.poachedRoster.set(id, idol);
            return await dbManager.saveIdolData(idol);
        }
        return false;
    }

    async poachIdol(id) {
        if (this.roster.has(id)) {
            const idol = this.roster.get(id);
            idol.status = 'poached';
            idol.agency = 'rival';
            this.roster.delete(id);
            this.poachedRoster.set(id, idol);
            return await dbManager.saveIdolData(idol);
        }
        return false;
    }

    async unPoachIdol(id) {
        if (this.poachedRoster.has(id)) {
            const idol = this.poachedRoster.get(id);
            delete idol.status;
            idol.agency = 'player';
            this.poachedRoster.delete(id);
            this.roster.set(id, idol);
            return await dbManager.saveIdolData(idol);
        }
        return false;
    }

    async updateIdolTrend(id) {
        const idol = this.roster.get(id);
        if (!idol) return null;

        const prompt = `Phân tích biến động thị trường cho: "${idol.name}". Stats hiện hành: Fame(${idol.stats.fame}), Visual(${idol.stats.visual}), Risk(${idol.stats.scandal_risk}). 
        Tạo 1 sự kiện trend (tiếng Việt). LƯU Ý: Danh tiếng (Fame) KHÔNG CÓ GIỚI HẠN. Visual và Risk giới hạn 0-100.
        BẮT BUỘC TRẢ VỀ JSON (Không chứa chú thích): {"fame_change": X, "visual_change": Y, "scandal_risk_change": Z, "trend_reason": "..."}`;

        try {
            let res;
            try {
                res = await apiManager.generateText(prompt);
            } catch (innerError) {
                if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('gemini-quota-exhausted'));
            }
            const json = JSON.parse(this._extractJSON(res));
            
            idol.stats.fame = Math.max(0, idol.stats.fame + (json.fame_change || 0));
            idol.stats.visual = Math.min(100, Math.max(0, idol.stats.visual + (json.visual_change || 0)));
            idol.scandalRisk = Math.min(100, Math.max(0, (idol.scandalRisk || idol.stats.scandal_risk || 0) + (json.scandal_risk_change || 0)));
            idol.stats.scandal_risk = idol.scandalRisk;
            idol.latestTrend = json.trend_reason;
            
            await dbManager.saveIdolData(idol);
            if(typeof gameManager !== 'undefined') gameManager.checkAchievement('STATS_UPDATE', idol.stats);
            return idol;
        } catch (e) { return null; }
    }

    async inferIdolNationality(id) {
        const idol = this.roster.get(id);
        if(!idol) throw new Error("Idol not found");
        
        const systemPrompt = `Dựa vào tên nghệ danh "${idol.name}", cốt truyện: "${idol.bio}" và phong cách: "${idol.concept}", hãy dự đoán quốc tịch/vùng lãnh thổ xuất xứ hoặc sắc tộc của Model này (ví dụ: Vietnamese, Korean, American, Japanese, French, Latin, vv).
Trả về MỘT TỪ DUY NHẤT chứa tên quốc gia hoặc vùng lãnh thổ bằng tiếng Anh (chỉ 1-2 từ, KHÔNG có dấu ngoặc kép hay giải thích). Ví dụ: Japanese`;

        try {
            let res;
            try {
                res = await apiManager.generateText(systemPrompt);
            } catch (innerError) {
                if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('gemini-quota-exhausted'));
            }
            let nat = res.trim().replace(/["']/g, '');
            if(!nat || nat.length > 30) nat = "International"; // fallback
            idol.nationality = nat;
            this.roster.set(id, idol);
            await dbManager.saveIdolData(idol);
            return nat;
        } catch (e) {
            console.error("Lỗi khi nội suy quốc tịch:", e);
            throw e;
        }
    }
}
const cardEngine = new CardEngine();
