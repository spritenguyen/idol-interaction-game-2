const gameApp = {
    currentRenderSession: null,
	currentScoutCandidate: null,
    fallbackImage: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjODg4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4Ij5OTyBJTUFHRTwvdGV4dD48L3N2Zz4=",

    activeTasks: {},

    checkPendingEvents() {
        if (this.hasAnyTaskRunning() || document.getElementById('dialog-modal').style.display === 'flex') return;
        
        if (this.pendingRandomEvent) {
            this.pendingRandomEvent = false;
            this.triggerRandomEvent();
        } else if (this.pendingFashionWeek) {
            this.pendingFashionWeek = false;
            this.triggerFashionWeek();
        } else if (this.pendingScandalCrisis) {
            const idolId = this.pendingScandalCrisis;
            this.pendingScandalCrisis = null;
            this.triggerScandalCrisis(idolId);
        } else if (this.pendingHeadhunting) {
            const idolId = this.pendingHeadhunting;
            this.pendingHeadhunting = null;
            this.triggerHeadhunting(idolId);
        }
    },

    startTask(id, name) {
        this.activeTasks[id] = name;
        this.renderTaskQueue();
    },

    endTask(id) {
        delete this.activeTasks[id];
        this.renderTaskQueue();
        setTimeout(() => this.checkPendingEvents(), 500);
    },

    modifyIdolPhysique(idol, key, delta) {
        if (!idol || !idol.measurements) return;
        let m = idol.measurements;
        if (!m[key] || m[key] === "?") return;
        let currentStr = m[key].toString();
        let match = currentStr.match(/\d+(\.\d+)?/);
        if (match) {
            let num = parseFloat(match[0]);
            let newVal = Math.max(10, num + delta);
            newVal = Math.round(newVal * 10) / 10;
            m[key] = currentStr.replace(match[0], newVal);
        }
    },

    isTaskRunning(id) {
        return !!this.activeTasks[id];
    },

    hasAnyTaskRunning() {
        return Object.keys(this.activeTasks).length > 0;
    },

    renderTaskQueue() {
        const container = document.getElementById('task-queue-container');
        if (!container) return;
        
        container.innerHTML = '';
        const taskKeys = Object.keys(this.activeTasks);
        if (taskKeys.length > 0) {
            const wrapper = document.createElement('div');
            wrapper.style = `
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(251, 191, 36, 0.5);
                padding: 10px 20px;
                border-radius: var(--radius-full);
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(251, 191, 36, 0.15);
                color: #e2e8f0;
                font-size: 14px;
                pointer-events: none;
                animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            `;
            
            const firstTaskName = this.activeTasks[taskKeys[0]];
            const taskText = taskKeys.length > 1 ? `Hệ thống AI đang nội suy ${taskKeys.length} tiến trình...` : firstTaskName;

            wrapper.innerHTML = `
                <div style="width: 18px; height: 18px; border: 2px solid rgba(251, 191, 36, 0.3); border-top: 2px solid var(--gold); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="font-weight: 500; letter-spacing: 0.5px;">🪄 ${taskText}</span>
            `;

            container.appendChild(wrapper);
        }
        
        if (!document.getElementById('task-queue-style')) {
            const style = document.createElement('style');
            style.id = 'task-queue-style';
            style.innerHTML = `
                @keyframes popIn { 0% { transform: scale(0.9) translateY(-10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes shake { 0%, 100% {transform: rotate(0deg);} 25% {transform: rotate(15deg);} 75% {transform: rotate(-15deg);} }
            `;
            document.head.appendChild(style);
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : '🔔'}</span> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    toggleSettings(show) { document.getElementById('settings-modal').style.display = show ? 'flex' : 'none'; },
	
    async applyCachedBackground(viewName) {
        if (!['shop', 'studio', 'condo', 'spa'].includes(viewName)) {
            document.body.style.backgroundImage = 'none';
            return;
        }
        
        let prompt = "";
        if (viewName === 'shop') prompt = "High-fashion luxury boutique interior, warm lighting, elegant clothing racks, 8k, photorealistic";
        if (viewName === 'studio') prompt = "Professional cinematic photo studio, black background, studio lights, softbox, highly detailed";
        if (viewName === 'condo') prompt = "Luxury modern apartment living room, night city view from window, cozy warm aesthetic, 8k";
        if (viewName === 'spa') prompt = "Luxury spa interior, relaxing mood, dim lighting, bamboo, water feature, 8k";
        
        if (prompt) {
            try {
                const b64 = await pollinationsService.generateImage(prompt, null, true); // true = useCache
                if (b64) {
                    document.body.style.backgroundImage = `url('${b64}')`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    document.body.style.backgroundAttachment = 'fixed';
                    
                    const layout = document.querySelector('.app-layout');
                    if (layout) layout.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
                }
            } catch (e) {
                console.warn("Could not load view background: ", e);
            }
        }
    },

    switchView(viewName) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));

        const selectedBtn = document.getElementById(`nav-btn-${viewName}`);
        const selectedView = document.getElementById(`${viewName}-view`);
        
        if(selectedBtn) selectedBtn.classList.add('active');
        if(selectedView) selectedView.classList.remove('hidden');

        // Apply dynamic AI cached background
        this.applyCachedBackground(viewName);

        if(viewName === 'scout') this.renderScoutView();
        if(viewName === 'shop') this.renderShop();
        if(viewName === 'jobs') this.renderJobs();
        if(viewName === 'spa') this.renderSpa();
        if(viewName === 'underground') this.renderUndergroundRoster();
        if(viewName === 'rivals') this.generateRivalsLeaderboard();
        if(viewName === 'condo') {
            this.renderCondo();
            this.checkCondoNightEvent();
        }
        if(viewName === 'brand') this.renderBrandRequests();
    },

    renderUndergroundRoster() {
        this.renderBlackMarket();
        const list = document.getElementById('ug-roster-list');
        if (!list) return;
        const idols = cardEngine.getAllIdols();
        
        if (idols.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Bạn chưa có Model nào.</p>';
            return;
        }

        let html = '';
        idols.forEach(i => {
            const corr = i.corruption || 0;
            const stress = i.stress || 0;
            const level = i.level || 1;
            const scandal = i.scandalRisk || 0;
            const isCancelled = scandal >= 100;
            
            html += `
                <div style="background:var(--bg-elevated); padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid ${isCancelled ? '#7f1d1d' : (corr >= 50 || scandal >= 70 ? '#ef4444' : 'var(--border-color)')}; display:flex; align-items:center; gap: 12px; opacity: ${isCancelled ? 0.7 : 1};">
                    <img src="${i.avatarUrl || this.fallbackImage}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: ${isCancelled ? '#ef4444' : 'var(--text-main)'}; font-size: 13px;">${i.name} ${isCancelled ? '[BỊ PHONG SÁT]' : ''}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">LV: ${level} | Stress: <span style="color:${stress>50?'var(--error)':'var(--success)'}">${stress}</span> | Tha hóa: <span style="color:${corr>0?'#ef4444':'var(--text-muted)'}">${corr}/100</span> | Scandal: <span style="color:${scandal>50?'#ef4444':'var(--primary)'}">${scandal}%</span></div>
                    </div>
                    <button class="btn-action" style="padding: 4px 8px; font-size: 11px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; min-width: 60px;" onclick="gameApp.selectUndergroundModel('${i.id}', this)" ${isCancelled ? 'title="Có thể thao tác đồ chợ đen"' : ''}>CHỌN</button>
                </div>
            `;
        });
        list.innerHTML = html;
        this.currentUgModelId = null;
    },

    renderBlackMarket() {
        const grid = document.getElementById('black-market-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const currentMoney = gameManager.state.money || 0;
        
        gameManager.blackMarketItems.forEach(item => {
            const canAfford = currentMoney >= item.price;
            const div = document.createElement('div');
            div.innerHTML = `
                <div style="background: rgba(40,10,10,0.5); padding: 12px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.2); display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                    <div style="flex: 1;">
                        <h4 style="color:var(--primary); margin:0 0 4px 0; font-size: 13px;">${item.name}</h4>
                        <p style="font-size: 11px; color:var(--text-muted); margin:0;">${item.desc}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                        <span style="color: ${canAfford ? '#34d399' : '#ef4444'}; font-weight: bold; font-size: 12px;">${item.price.toLocaleString()} 💰</span>
                        <button class="btn-action" style="${canAfford ? 'background: #4a0f12; color: #ef4444; border: 1px solid #ef4444;' : 'background: rgba(255,255,255,0.1); color: var(--text-muted); cursor: not-allowed;'} padding: 4px 8px; font-size: 11px;" onclick="gameApp.buyBlackMarketItem('${item.id}')" ${!canAfford ? 'disabled' : ''}>MUA & DÙNG CHO CHỈ ĐỊNH</button>
                    </div>
                </div>
            `;
            grid.appendChild(div);
        });
    },

    buyBlackMarketItem(itemId) {
        if (!this.currentUgModelId) {
            return this.showToast("Vui lòng CHỌN 1 MODEL ở danh sách bên dưới trước!", "error");
        }
        
        const item = gameManager.blackMarketItems.find(i => i.id === itemId);
        if (!item || gameManager.state.money < item.price) {
            return this.showToast("Không đủ tiền!", "error");
        }
        
        const idol = cardEngine.getIdol(this.currentUgModelId);
        if(!idol) return;

        if (item.type === 'bm_wipe' && (idol.scandalRisk || 0) <= 0) {
            return this.showToast("Model này đang không có nguy cơ scandal nào!", "info");
        }
        if (item.type === 'bm_brainwash' && (idol.stress || 0) <= 0) {
            return this.showToast("Model này không bị Căng thẳng!", "info");
        }

        this.showDialog({
            title: "XÁC NHẬN GIAO DỊCH NGẦM",
            message: `MUA VÀ ÁP DỤNG NGAY: <strong>${item.name}</strong> cho <strong>${idol.name}</strong>?<br>Giá: ${item.price}💰<br>Chi tiết: ${item.desc}<br><br><span style="color:var(--error);">Đây là giao dịch Không Hoàn Lại.</span>`,
            type: "confirm",
            onConfirm: () => {
                gameManager.updateMoney(-item.price);
                
                idol.scandalRisk = idol.scandalRisk || 0;
                idol.corruption = idol.corruption || 0;
                idol.stress = idol.stress || 0;
                idol.affinity = idol.affinity || 30;

                if (item.type === 'bm_visual') {
                    idol.stats.visual = Math.min(100, idol.stats.visual + item.effect);
                    idol.scandalRisk = Math.min(100, idol.scandalRisk + 15);
                    idol.corruption = Math.min(100, idol.corruption + 20);
                } else if (item.type === 'bm_brainwash') {
                    idol.stress = 0;
                    idol.affinity = Math.max(0, idol.affinity - 30);
                    idol.corruption = Math.min(100, idol.corruption + 30);
                    idol.scandalRisk = Math.min(100, idol.scandalRisk + 10);
                } else if (item.type === 'bm_fame') {
                    idol.stats.fame += item.effect;
                    cardEngine.updateTotalFame(); // Cập nhật fame tổng
                    idol.scandalRisk = Math.min(100, idol.scandalRisk + 25);
                    idol.stats.scandal_risk = idol.scandalRisk;
                } else if (item.type === 'bm_wipe') {
                    idol.scandalRisk = Math.max(0, idol.scandalRisk + item.effect);
                } else if (item.type === 'bm_sabotage_rivals') {
                    idol.scandalRisk = Math.min(100, idol.scandalRisk + 10);
                    setTimeout(() => {
                        this.showToast("Bóc phốt thành công! Các đối thủ trên BXH đã bị giảm Fame đáng kể.", "success");
                        // Refresh the leaderboard randomly but in player's favor
                        this.generateRivalsLeaderboard(true);
                    }, 500);
                }

                idol.stats.scandal_risk = idol.scandalRisk;
                dbManager.saveIdolData(idol);
                this.renderUndergroundRoster();
                this.refreshUI(idol.id); // Sync all views
                this.showToast(`Áp dụng ${item.name} cho ${idol.name} thành công.`, "error"); // Hiện Toast đỏ
            }
        });
    },

    selectUndergroundModel(id, btn) {
        this.currentUgModelId = id;
        
        // Reset all buttons in list
        const list = document.getElementById('ug-roster-list');
        const buttons = list.querySelectorAll('button');
        buttons.forEach(b => {
             b.style.background = 'rgba(239, 68, 68, 0.2)';
             b.innerText = 'CHỌN';
        });

        // Highlight selected
        if (btn) {
             btn.style.background = '#ef4444';
             btn.style.color = '#fff';
             btn.innerText = 'ĐÃ CHỌN';
        }
    },
    
    triggerUndergroundJob(jobType) {
        if (!this.currentUgModelId) {
            return this.showToast("Vui lòng CHỌN 1 MODEL CỤ THỂ ở danh sách TÌNH TRẠNG THA HÓA trước!", "error");
        }
        const idol = cardEngine.getIdol(this.currentUgModelId);
        if (!idol) return;
        
        if (idol.scandalRisk >= 100) {
            return this.showToast("MODEL ĐÃ BỊ PHONG SÁT, KHÔNG THỂ THỰC HIỆN CÔNG VIỆC!", "error");
        }

        const corr = idol.corruption || 0;
        const stress = idol.stress || 0;
        const level = idol.level || 1;
        const affinity = idol.affinity || 30;

        let moneyReward = 0;
        let stressCost = 0;
        let corrGain = 0;
        let affinityCost = 0;
        let scandalCost = 0;
        let jobName = "";

        if (jobType === 'photo') {
            if (stress <= 50 && level <= 2) return this.showToast("Điều kiện chụp nhạy cảm: Căng thẳng > 50 HOẶC LV > 2!", "error");
            jobName = "Chụp Ảnh Nhạy Cảm";
            moneyReward = 8000; stressCost = 20; corrGain = 10; affinityCost = 0; scandalCost = 5;
        } else if (jobType === 'vip') {
            if (level <= 3) return this.showToast("Điều kiện tiếp khách: LV > 3!", "error");
            jobName = "Tiếp Khách VIP Ngầm";
            moneyReward = 15000; stressCost = 30; corrGain = 15; affinityCost = 0; scandalCost = 10;
        } else if (jobType === 'party') {
            if (corr <= 10) return this.showToast("Điều kiện dự tiệc đen: Tha hóa tối thiểu > 10!", "error");
            jobName = "Dự Tiệc Đen";
            moneyReward = 30000; stressCost = 40; corrGain = 25; affinityCost = 20; scandalCost = 20;
        }

        this.showDialog({
            title: "XÁC NHẬN GIAN LẬP / CÔNG VIỆC NGẦM",
            message: `<strong>Công việc:</strong> ${jobName}<br><strong>Model:</strong> ${idol.name}<br><br><strong>Hậu quả:</strong><br>- Căng thẳng: <span style="color:var(--error);">+${stressCost}</span><br>- Tha hóa: <span style="color:var(--error);">+${corrGain}</span><br>${affinityCost > 0 ? `- Hảo cảm: <span style="color:var(--error);">-${affinityCost}</span><br>` : ''}- Scandal Risk: <span style="color:var(--error);">+${scandalCost}%</span><br><br><strong>TIỀN THƯỞNG:</strong> <strong style="color:var(--success);">+${moneyReward} 💰</strong><br><br>Bạn có chắc chắn muốn đẩy cô ấy vào vũng lầy này?`,
            type: "confirm",
            onConfirm: () => {
                gameManager.updateMoney(moneyReward);
                idol.stress = stress + stressCost;
                if (idol.stress > 100) idol.stress = 100;
                
                idol.corruption = corr + corrGain;
                if (idol.corruption > 100) idol.corruption = 100;
                
                idol.scandalRisk = (idol.scandalRisk || 0) + scandalCost;
                if (idol.scandalRisk >= 100) {
                    idol.scandalRisk = 100;
                    this.showToast(`CẢNH BÁO: ${idol.name} ĐÃ BỊ PHONG SÁT DO LỘ SCANDAL NGHIÊM TRỌNG!`, "error");
                }
                idol.stats.scandal_risk = idol.scandalRisk;

                idol.affinity = affinity - affinityCost;
                if (idol.affinity < 0) idol.affinity = 0;

                if (idol.corruption >= 100 && (!idol.concept || !idol.concept.includes("Dark Muse"))) {
                    idol.concept = (idol.concept || '') + " | Dark Muse";
                    this.showToast(`CẢNH BÁO: ${idol.name} ĐÃ BỊ THA HÓA HOÀN TOÀN TRỞ THÀNH DARK MUSE!`, "error");
                }

                dbManager.saveIdolData(idol);
                setTimeout(() => {
                    this.renderUndergroundRoster();
                    this.refreshUI(idol.id); // Sync all views
                }, 100);
                this.showToast(`Hoàn thành ${jobName}! Nhận ${moneyReward}💰`, "success");
            }
        });
    },

    /* ======================================================================
       RIVAL AGENCIES & AI SHOWBIZ LOGIC
       ====================================================================== */
    
    async generateRivalNews() {
        const eventsContainer = document.getElementById('rivals-events');
        if (!eventsContainer) return;

        const provider = document.getElementById('logic-provider').value;
        const service = (provider === 'gemini') ? geminiService : pollinationsService;

        eventsContainer.innerHTML = '<p style="color:var(--text-muted); font-size: 13px; text-align: center;"><span class="loading-spinner"></span> Trí tuệ nhân tạo đang phân tích Showbiz Data...</p>';
        this.startTask('fetch_rival_news', 'Đang cập nhật Radar Đối thủ...');

        const prompt = `Bạn là một AI quản lý rủi ro trong ngành giải trí showbiz. Hãy tạo ra 1 tin tức/biến cố ngắn về một (hoặc nhiều) "Agency đối thủ" đang tranh giành thị phần với công ty của người chơi. Tên các đối thủ ngẫu nhiên có thể là: "Starfall Agency", "Onyx Entertainment", "Aurora Models"...
        Output một JSON object DUY NHẤT:
        {
           "headline": "Tiêu đề tin tức (gây cấn, giật gân, ví dụ: 'Starfall Agency cướp hợp đồng tỷ đô!')",
           "content": "Mô tả chi tiết biến cố. Nêu rõ động thái của đối thủ, hoặc một scandal để người chơi có thể đục nước béo cò, hoặc một chiến tranh lạnh về thời trang.",
           "action_type": "sabotage" | "opportunity" | "threat",
           "suggestion": "Gợi ý 1 hành động/tính năng cho người chơi (ví dụ: 'Yêu cầu Model cày Affinity để chống lại đối thủ', 'Triển khai dự án ảnh mới để chiếm viral')"
        }
        Trả về đúng định dạng JSON, không có code block markdown.`;

        try {
            let jsonString = (provider === 'gemini') ? await service.generateContent(prompt) : await service.generateText(prompt);
            jsonString = jsonString.replace(/```json/gi, "").replace(/```/g, "").trim();
            const data = JSON.parse(jsonString);

            let actionColor = "var(--primary)";
            if (data.action_type === "sabotage" || data.action_type === "threat") actionColor = "var(--error)";

            eventsContainer.innerHTML = `
                <div style="background: rgba(40,10,10,0.5); padding: 15px; border-radius: 8px; border: 1px solid ${actionColor}; margin-bottom: 12px; position:relative; overflow:hidden;">
                    <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:${actionColor};"></div>
                    <h4 style="color: ${actionColor}; margin: 0 0 8px 10px; font-size: 14px;">${data.headline}</h4>
                    <p style="color: var(--text-main); font-size: 13px; margin-left: 10px; margin-bottom: 10px; line-height:1.5;">${data.content}</p>
                    <div style="background: rgba(0,0,0,0.4); padding: 10px; margin-left: 10px; border-radius: 6px; font-size: 12px;">
                        <span style="color:var(--gold);">💡 AI Đề xuất:</span> <br><span style="color:var(--text-muted);">${data.suggestion}</span>
                    </div>
                    <div style="margin-top: 12px; display:flex; justify-content: flex-end;">
                        <button class="btn-action w-full" style="border:1px solid ${actionColor}; color:${actionColor}; background:transparent;" onclick="gameApp.switchView('studio')">ĐÁP TRẢ BẰNG PHOTOSHOOT</button>
                    </div>
                </div>
            `;
            
            // Randomly update leaderboard when event happens
            this.generateRivalsLeaderboard();

        } catch (error) {
            console.error("Rival gen fail:", error);
            eventsContainer.innerHTML = `<p style="color:var(--error); text-align:center;">Lỗi đường truyền Radar Showbiz. Thử lại sau.</p>`;
        } finally {
            this.endTask('fetch_rival_news');
        }
    },

    async generateRivalsLeaderboard(sabotaged = false) {
        const lbContainer = document.getElementById('rivals-leaderboard');
        if (!lbContainer) return;

        // Giả lập điểm của mình bằng cách lấy tổng fans
        let myTotalFans = 0;
        let myTotalFame = 0;
        cardEngine.getAllIdols().forEach(id => {
            myTotalFans += (id.fans || 0);
            myTotalFame += (id.stats?.visual || 0) + (id.stats?.charm || 0);
        });

        const myScore = (myTotalFans * 0.5) + (myTotalFame * 10) + (gameManager.state.diamonds * 100);

        let sFactor1 = sabotaged ? 0.2 : (Math.random() + 0.5);
        let sFactor2 = sabotaged ? 0.1 : (Math.random() * 0.8 + 0.3);
        let sFactor3 = sabotaged ? 0.3 : (Math.random() * 1.5 + 0.8);

        const agencies = [
            { name: "My Agency (You)", score: myScore.toFixed(0), isMe: true },
            { name: "Starfall Agency", score: (myScore * sFactor1).toFixed(0) },
            { name: "Onyx Entertainment", score: (myScore * sFactor2).toFixed(0) },
            { name: "Aurora Models", score: (myScore * sFactor3).toFixed(0) }
        ];

        agencies.sort((a,b) => b.score - a.score);

        let html = '';
        agencies.forEach((ag, idx) => {
            let rankColor = "var(--text-muted)";
            if (idx === 0) rankColor = "var(--gold)";
            if (idx === 1) rankColor = "#94a3b8"; // Silver
            if (idx === 2) rankColor = "#b45309"; // Bronze

            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:${ag.isMe ? 'rgba(251,191,36,0.1)' : 'rgba(0,0,0,0.3)'}; border-left:4px solid ${rankColor}; border-radius:4px; margin-bottom:5px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="font-weight:bold; font-size:16px; color:${rankColor}; width:20px; text-align:center;">#${idx+1}</div>
                        <div style="font-weight:bold; color:${ag.isMe ? 'var(--gold)' : 'var(--text-main)'};">${ag.name}</div>
                    </div>
                    <div style="color:var(--primary); font-family:monospace; font-size:14px;">${ag.score} <span style="font-size:11px;color:var(--text-muted)">RP</span></div>
                </div>
            `;
        });

        lbContainer.innerHTML = html;
    },

    /* ======================================================================
       BLACK MARKET / UNDERGROUND LOGIC
       ====================================================================== */

    async generateBlackContract() {
        const container = document.getElementById('ai-black-contract-container');
        if (!container) return;
        
        const provider = document.getElementById('logic-provider').value;
        let service = (provider === 'gemini') ? geminiService : pollinationsService;
        
        container.innerHTML = '<p style="color:var(--text-muted); font-size: 13px; text-align: center;"><span class="loading-spinner"></span> Gửi yêu cầu mật khẩu vào Dark Web...</p>';
        this.startTask('fetch_dark_job', 'Đang truy cập tài nguyên ngầm qua Dark Web...');
        
        const prompt = `Bạn là một kẻ môi giới thế giới ngầm trong ngành giải trí. Phát sinh ngẫu nhiên 1 Hợp đồng đen (Black Contract) cực kỳ nguy hiểm và cám dỗ cho một nữ người mẫu/idol bị ép buộc hoặc tự nguyện sa ngã. Output duy nhất 1 JSON object với các keys: 
        "title" (tên phi vụ, ngắn gọn, chữ in hoa, có tính chất bí mật/nguy hiểm), 
        "desc" (mô tả công việc chi tiết, ám muội, rủi ro đánh đổi danh giá lấy tiền bạc), 
        "reward" (từ 50000 đến 150000), 
        "stress" (từ 30 đến 70), 
        "corruption" (từ 25 đến 50), 
        "scandal" (từ 20 đến 45). 
        TUYỆT ĐỐI CHỈ TRẢ VỀ JSON HỢP LỆ. KHÔNG BAO GỒM MARKDOWN HAY BÌNH LUẬN NÀO KHÁC. NHỚ KIỂM TRA DỰ KIẾN DẤU PHẨY.`;

        try {
            let jsonString = (provider === 'gemini') ? await service.generateContent(prompt) : await service.generateText(prompt);
            
            this.endTask('fetch_dark_job');

            jsonString = (jsonString || '').replace(/```(json)?/gi, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonString);
            
            container.innerHTML = `
                <div class="ug-job-card" style="background: rgba(40,10,10,0.8); padding: 16px; border-radius: 8px; border: 1px solid #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px;">
                        <h4 style="color:#ef4444; margin:0; text-transform: uppercase;">🔥 ${data.title}</h4>
                        <span style="color:var(--primary); font-weight:bold; font-size: 16px;">+${data.reward.toLocaleString()} 💰</span>
                    </div>
                    <p style="font-size: 12px; color:var(--text-main); margin-bottom: 12px; font-style: italic;">"${data.desc}"</p>
                    <p style="font-size: 11px; color:var(--text-muted); margin-bottom: 12px;">Hậu quả (dự kiến): Căng thẳng +${data.stress}&nbsp; | &nbsp;Tha hóa +${data.corruption}&nbsp; | &nbsp;Scandal Risk +${data.scandal}%</p>
                    <button class="btn-action w-full" style="background: #ef4444; color: #fff; font-weight: bold; border-radius: 4px;" onclick="gameApp.executeCustomUndergroundJob('${btoa(unescape(encodeURIComponent(JSON.stringify(data))))}')">KÝ HỢP ĐỒNG ĐEN NÀY BAO CHECK</button>
                </div>
            `;
        } catch (e) {
            this.endTask('fetch_dark_job');
            container.innerHTML = '<p style="color:#ef4444; font-size: 12px; text-align: center;">Việc lấy hợp đồng đen thất bại. Vui lòng thử lại.</p>';
            console.error("AI Black Contract error", e);
        }
    },

    executeCustomUndergroundJob(dataBase64) {
        if (!this.currentUgModelId) {
            return this.showToast("CHỌN 1 MODEL CỤ THỂ Ở DANH SÁCH BÊN DƯỚI ĐỂ NHẬN HỢP ĐỒNG NÀY!", "error");
        }
        const idol = cardEngine.getIdol(this.currentUgModelId);
        if (!idol) return;
        
        if (idol.scandalRisk >= 100) {
            return this.showToast("MODEL NÀY ĐÃ BỊ PHONG SÁT, HẾT GIÁ TRỊ LỢI DỤNG!", "error");
        }
        
        let data;
        try { data = JSON.parse(decodeURIComponent(escape(atob(dataBase64)))); } catch (e) { return; }
        
        this.showDialog({
            title: `ÉP MỘT CÁCH ĐỘC ÁC: ${data.title}`,
            message: `<strong>Model:</strong> ${idol.name}<br><br><strong>Thu về:</strong> <strong style="color:var(--success);">${data.reward.toLocaleString()} 💰</strong><br><br>Nhưng cô ấy phải gánh chịu:<br>- Căng thẳng: <span style="color:var(--error);">+${data.stress}</span><br>- Tha hóa: <span style="color:var(--error);">+${data.corruption}</span><br>- Scandal Risk: <span style="color:var(--error);">+${data.scandal}%</span><br><br>Bạn có chắc muốn đẩy cô ấy làm không?`,
            type: "confirm",
            onConfirm: () => {
                gameManager.updateMoney(data.reward);
                idol.stress = Math.min(100, (idol.stress || 0) + data.stress);
                idol.corruption = Math.min(100, (idol.corruption || 0) + data.corruption);
                idol.scandalRisk = Math.min(100, (idol.scandalRisk || 0) + data.scandal);
                idol.stats.scandal_risk = idol.scandalRisk;
                
                if (idol.scandalRisk >= 100) {
                    this.showToast(`CẢNH BÁO: ${idol.name} ĐÃ BỊ PHONG SÁT VÀ NÉM ĐÁ TRÊN REDDIT/TWITTER!`, "error");
                }
                if (idol.corruption >= 100 && !idol.concept.includes("Dark Muse")) {
                    idol.concept = (idol.concept || '') + " | Dark Muse";
                    this.showToast(`${idol.name} ĐÃ BỊ THA HÓA HOÀN TOÀN!`, "error");
                }
                
                dbManager.saveIdolData(idol);
                setTimeout(() => {
                    this.renderUndergroundRoster();
                    this.refreshUI(idol.id); // Sync all views
                    document.getElementById('ai-black-contract-container').innerHTML = '';
                }, 100);
                this.showToast(`Hợp đồng đen hoàn tất! Tài khoản cộng ${data.reward.toLocaleString()}💰`, "success");
            }
        });
    },

    renderBrandRequests() {
        if (!gameManager.state.brandRequests || gameManager.state.brandRequests.length === 0) {
            gameManager.state.brandRequests = [
                { brand: "ZARA", requirement: "Streetwear, urban setting, dynamic posing, trendy outfit", reward: 8000, reqFame: 100 },
                { brand: "Vogue Magazine", requirement: "Haute couture, dramatic lighting, high fashion pose, elegant dress", reward: 20000, reqFame: 500 },
                { brand: "Nike", requirement: "Sportswear, running track, sweating, dynamic action, runner", reward: 12000, reqFame: 200 }
            ];
        }

        const grid = document.getElementById('brand-requests-grid');
        if (!grid) return;
        grid.innerHTML = '';

        gameManager.state.brandRequests.forEach((req, idx) => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <h4 style="color:var(--primary); margin:0; font-size: 18px;">❖ ${req.brand}</h4>
                <p style="font-size: 13px; margin: 10px 0; color: var(--text-muted); line-height: 1.5;">
                    <strong>Yêu cầu Concept:</strong> <br> <span style="color:#e2e8f0;">${req.requirement}</span><br>
                    <strong style="margin-top: 8px; display: inline-block;">Fan tối thiểu:</strong> ${req.reqFame} Fans
                </p>
                <div style="color: var(--gold); font-size: 16px; font-weight: bold; margin-bottom: 15px;">Thù lao: ${req.reward.toLocaleString()} 💰</div>
                <button class="btn-action w-full" style="background:var(--bg-elevated); border:1px solid var(--primary);" onclick="gameApp.acceptBrandJob(${idx})">TIẾP NHẬN BẢN BRIEF</button>
            `;
            grid.appendChild(div);
        });
    },

    refreshBrandRequests() {
        if (gameManager.state.money < 100) {
            return this.showToast("Cần 100 💰 để làm mới yêu cầu nhãn hàng!", "error");
        }
        gameManager.updateMoney(-100);
        
        const possibleBrands = ["Prada", "Gucci", "Chanel", "Balenciaga", "Local Brand", "Tech Magazine", "Sports Illustrated", "Cosmopolitan"];
        const possibleReqs = [
            "Luxury handbag showcase, elegant, high fashion, studio lighting",
            "Summer beachwear, sunny, ocean background, joyful expression",
            "Cyberpunk styled outfit, neon lights, futuristic, edgy pose",
            "Minimalist clean aesthetic, white dress, soft natural light",
            "Gothic makeup, dark environment, mysterious, intense eyes"
        ];
        
        gameManager.state.brandRequests = [1,2,3].map(() => ({
            brand: possibleBrands[Math.floor(Math.random() * possibleBrands.length)],
            requirement: possibleReqs[Math.floor(Math.random() * possibleReqs.length)],
            reward: Math.floor(Math.random() * 20 + 5) * 1000,
            reqFame: Math.floor(Math.random() * 5 + 1) * 100
        }));
        
        this.renderBrandRequests();
        this.showToast("Đã cập nhật danh sách Brand mới!", "success");
    },

    acceptBrandJob(idx) {
        const req = gameManager.state.brandRequests[idx];
        
        // Bidding War (30% chance for an AI rival to jump in)
        if (Math.random() < 0.3) {
            const extraCost = Math.floor(req.reward * 0.15) + 1000;
            this.showDialog({
                title: `🚨 BIDDING WAR: KẺ ĐỊCH CƯỚP THẦU !`,
                message: `Một Agency Đối Thủ vừa gửi thư tới <strong>${req.brand}</strong>, tuyên bố sẽ làm tốt hơn với giá rẻ hơn!<br><br>Bạn có muốn tung thêm <strong>${extraCost} 💰</strong> tiền túi làm ngân sách PR để giữ lại hợp đồng này?`,
                type: "confirm",
                onConfirm: () => {
                    if (gameManager.state.money < extraCost) {
                        return this.showToast("Không đủ tiền để Bid giành hợp đồng! Hợp đồng đã bị mất.", "error");
                    }
                    gameManager.updateMoney(-extraCost);
                    this.showToast(`Đã chi ${extraCost} 💰. Hợp đồng thành công giữ lại!`, "success");
                    this.proceedBrandJob(req, idx);
                }
            });
        } else {
            this.proceedBrandJob(req, idx);
        }
    },

    proceedBrandJob(req, idx) {
        this.currentBrandSession = req; // Store for later evaluation during photoshot
        this.currentBrandIndex = idx;
        
        this.showDialog({
            title: `BẢN BRIEF: ${req.brand}`,
            message: `Bạn cần đưa Model vào Studio và thiết lập Concept/Pose/Lighting sao cho sát nhất với yêu cầu sau:<br><br><strong>"${req.requirement}"</strong><br><br>Model cần đạt tối thiểu ${req.reqFame} Fans.<br>AI sẽ chấm điểm bức ảnh, nếu trên 80 điểm bạn sẽ nhận được ${req.reward} 💰.`,
            type: "info",
            onConfirm: () => {
                this.switchView('studio');
                const status = document.getElementById('studio-status');
                if (status) {
                    status.style.color = "var(--primary)";
                    status.innerHTML = `⚠️ Đang thực hiện Hợp đồng cho: <strong>${req.brand}</strong>. Xin chọn Model có đủ ${req.reqFame} Fans.`;
                }
            }
        });
    },

    renderSpa() {
        const grid = document.getElementById('spa-grid');
        grid.innerHTML = '';
        const spaServices = [
            { id: 'spa_relax', name: '🌿 Massage Thư giãn', desc: 'Giảm 50 Căng thẳng (Stress)', price: 100 },
            { id: 'spa_skin', name: '✨ Chăm sóc da chuyên sâu', desc: 'Tăng 5 Visual', price: 300 },
            { id: 'spa_vacation', name: '🏖️ Kỳ nghỉ dưỡng cao cấp', desc: 'Giảm 100 Stress, +15 Hảo cảm', price: 1000 },
            { id: 'spa_diet', name: '🏃‍♀️ Chế độ Ép cân Khắc nghiệt', desc: 'Giảm Căng nặng & Số đo Vòng 2. Hậu quả: +15 Căng thẳng.', price: 1500 },
            { id: 'spa_gym', name: '🏋️‍♀️ Chế độ Tập Gym Cường độ cao', desc: 'Tăng Số đo Vòng 1 & 3. Hậu quả: +15 Căng thẳng.', price: 1500 },
            { id: 'spa_plastic', name: '🔪 Phẫu Thuật Điêu Khắc', desc: 'Tăng ĐỘT BIẾN Nghệ thuật hình thể (Vòng 1 & 3). Hậu quả: Tha hóa +20, Căng thẳng +40.', price: 5000 }
        ];

        spaServices.forEach(srv => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <h4>${srv.name}</h4>
                <p>${srv.desc}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price" style="color:var(--primary)">${srv.price} 💰</span>
                </div>
                <button class="btn-action w-full mt-10" style="background:var(--bg-elevated); color:var(--text-main); border: 1px solid var(--border-color);" onclick="gameApp.buySpa('${srv.id}', ${srv.price})">CHỌN MODEL</button>
            `;
            grid.appendChild(div);
        });
    },

    renderCondo() {
        const grid = document.getElementById('condo-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const idols = cardEngine.getAllIdols();
        if (idols.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); font-size:14px; grid-column: 1/-1;">Chưa có Model nào để mời về căn hộ.</p>';
            return;
        }

        idols.forEach(idol => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            let safeAvatar = idol.avatarUrl && idol.avatarUrl !== 'undefined' && !idol.avatarUrl.startsWith('blob:') ? idol.avatarUrl : this.fallbackImage;
            
            const upgrades = idol.condoUpgrades || {};
            const hasStream = upgrades['stream'] || false;
            
            div.innerHTML = `
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                    <img src="${safeAvatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <h4 style="margin:0;">${idol.name}</h4>
                        <div style="font-size: 11px; color: var(--gold);">Hảo cảm: ${idol.affinity || 30}/100</div>
                    </div>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">Căn hộ số ${idol.id.substring(3, 7) || '101'}</p>
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    <button class="btn-action btn-primary w-full" onclick="gameApp.openCondoActionModal('${idol.id}')">🚪 VÀO CĂN HỘ (Hành Động Nhánh)</button>
                    <button class="btn-action w-full" style="background: linear-gradient(90deg, #1d4ed8, #4f46e5); color: #fff; border: 1px solid #6366f1; font-weight: bold;" onclick="gameApp.aiAutoJob('${idol.id}')">🤖 ĐỂ MODEL TỰ CHỌN JOB</button>
                    ${hasStream && idol.stress < 80 ? `<button class="btn-action w-full" style="background: linear-gradient(90deg, #ec4899, #db2777); color: white;" onclick="gameApp.startLivestream('${idol.id}')">🔴 MỞ LIVESTREAM TẠI NHÀ</button>` : ''}
                </div>
            `;
            grid.appendChild(div);
        });
    },

    async generateCondoDialogue(idol, actionType) {
        let interactionContext = "";
        if (actionType === "visit") {
            interactionContext = "You are unexpectedly visiting her private condo.";
        } else if (actionType === "gift") {
            interactionContext = "You just gave her a luxurious expensive gift.";
        }
        
        const promptText = `Act as a fashion model named "${idol.name}". 
Her concept/style is "${idol.concept || "Fashion"}". 
Her stats: Stress (${idol.stress || 0}/100), Corruption (${idol.corruption || 0}/100), Affinity with you (${idol.affinity || 0}/100).
${interactionContext}
Write a short dialogue (1-3 sentences max) reacting to you. Reply in Vietnamese. Make it feel like a dating sim interaction. Reflect her current stats (e.g., if stress is high, she sounds tired; if corruption is high, she sounds materialistic or dark; if affinity is high, she acts sweet or flirty).
Output ONLY the dialogue text directly, no quotes around it, no explanations.`;

        this.injectKeys();
        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            return result.replace(/['"«»*]/g, '').trim();
        } catch (e) {
            return actionType === 'visit' ? "Cảm ơn sếp đã đến thăm..." : "Ôi món quà đẹp quá, cảm ơn sếp!";
        }
    },

    openCondoActionModal(idolId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        const modal = document.getElementById('condo-action-modal');
        const body = document.getElementById('condo-modal-body');
        
        const upgrades = idol.condoUpgrades || {};
        
        let diaryHtml = '';
        if ((idol.affinity || 0) >= 50) {
            diaryHtml = `<button class="btn-action w-full" style="background:var(--bg-elevated); color:#facc15; border: 1px solid #facc15;" onclick="gameApp.readSecretDiary('${idol.id}')">📖 ĐỌC NHẬT KÝ BÍ MẬT</button>`;
        } else {
            diaryHtml = `<button class="btn-action w-full" style="background:var(--bg-elevated); color:var(--text-muted); border: 1px dashed var(--border-color);" disabled>🔒 NHẬT KÝ (Cần 50 Hảo Cảm)</button>`;
        }
        
        const tierObj = this.getModelTier(idol);
        const order = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
        const tierLevel = order[tierObj.id];

        const bedHtml = !upgrades['bed'] ? `<button class="btn-action" style="font-size: 11px;" onclick="gameApp.buyCondoUpgrade('${idol.id}', 'bed', 30)">Nâng cấp (30 💎)</button>` : '<span style="color:#10b981; font-size:12px;">Đã mua</span>';
        const vanityHtml = !upgrades['vanity'] ? `<button class="btn-action" style="font-size: 11px;" onclick="gameApp.buyCondoUpgrade('${idol.id}', 'vanity', 50)">Nâng cấp (50 💎)</button>` : '<span style="color:#10b981; font-size:12px;">Đã mua</span>';
        
        // Livestream requires Tier C or higher
        let streamHtml = '';
        if (tierLevel < 2) {
            streamHtml = '<span style="color:#fbbf24; font-size:11px;">Mở khóa từ hạng C (Fame > 50)</span>';
        } else {
            streamHtml = !upgrades['stream'] ? `<button class="btn-action" style="font-size: 11px;" onclick="gameApp.buyCondoUpgrade('${idol.id}', 'stream', 5000, 'money')">Cài đặt (5,000 💰)</button>` : '<span style="color:#10b981; font-size:12px;">Đã mua</span>';
        }

        body.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                <img src="${idol.avatarUrl || this.fallbackImage}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                <div>
                    <div style="display:inline-block; background:${tierObj.color}; color:#000; font-weight:bold; font-size:10px; padding:2px 6px; border-radius:4px; margin-bottom:4px;">TIER ${tierObj.id}</div>
                    <h3 style="margin:0; color:var(--text-main);">${idol.name}</h3>
                    <div style="font-size: 12px; color:var(--gold);">Hảo cảm: ${idol.affinity || 30}/100 | Căng thẳng: ${idol.stress || 0}/100</div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                <h4 style="margin:0 0 10px 0; color:var(--text-main); border-left: 3px solid #10b981; padding-left: 8px;">TƯƠNG TÁC SÂU (Tốn 1 Action)</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn-action btn-primary" onclick="gameApp.deepInteract('${idol.id}', 'cook')">🍳 Nấu Ăn Cùng Nhau</button>
                    <button class="btn-action" style="background:#8b5cf6;" onclick="gameApp.deepInteract('${idol.id}', 'talk')">💬 Trò Chuyện Tâm Giao</button>
                    <button class="btn-action" style="background:#f59e0b;" onclick="gameApp.deepInteract('${idol.id}', 'practice')">👗 Tập Luyện Kịch Bản</button>
                    ${upgrades['vanity'] ? `<button class="btn-action" style="background:#ec4899;" onclick="gameApp.deepInteract('${idol.id}', 'makeup')">💄 Makeup Chuyên Sâu</button>` : ''}
                </div>
                <div style="margin-top: 10px;">
                    <button class="btn-action w-full" style="background: var(--bg-elevated); color: var(--gold); border: 1px solid var(--gold);" onclick="gameApp.sendGift('${idol.id}')">🎁 Tặng quà bất ngờ (500💰)</button>
                </div>
                ${tierLevel >= 5 ? `<div style="margin-top: 10px;">
                    <button class="btn-action w-full" style="background: linear-gradient(90deg, #f59e0b, #ef4444); color: white; font-weight: bold; border: 1px solid #fbbf24;" onclick="gameApp.startWorldTour('${idol.id}')">✈️ TỔ CHỨC WORLD TOUR (10K💰)</button>
                </div>` : ''}
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                <h4 style="margin:0 0 10px 0; color:var(--text-main); border-left: 3px solid #facc15; padding-left: 8px;">MẢNH KÝ ỨC</h4>
                ${diaryHtml}
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                <h4 style="margin:0 0 10px 0; color:var(--text-main); border-left: 3px solid #ef4444; padding-left: 8px;">NỘI THẤT CĂN HỘ</h4>
                <div style="display:flex; flex-direction:column; gap:8px; font-size:13px; color:var(--text-muted);">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px;">
                        <span>🛏️ Giường Luxury (Giảm 1 Stress/Action)</span> ${bedHtml}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px;">
                        <span>💄 Bàn Trang Điểm (Mở khóa Makeup)</span> ${vanityHtml}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>🎙️ Dàn Livestream (Mở khóa Livestream)</span> ${streamHtml}
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
    },

    buyCondoUpgrade(idolId, upgradeKey, cost, currency = 'diamond') {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        if (currency === 'diamond') {
            if (gameManager.state.diamonds < cost) {
                return this.showToast(`Bạn cần ${cost} Kim Cương để nâng cấp!`, "error");
            }
            gameManager.updateDiamonds(-cost);
        } else {
            if (gameManager.state.money < cost) {
                return this.showToast(`Bạn cần ${cost} Ngân Sách để nâng cấp!`, "error");
            }
            gameManager.updateMoney(-cost);
        }
        
        if (!idol.condoUpgrades) idol.condoUpgrades = {};
        idol.condoUpgrades[upgradeKey] = true;
        dbManager.saveIdolData(idol);
        this.renderCondo();
        this.openCondoActionModal(idolId); // Refresh modal
        this.showToast("Nâng cấp thành công! Căn hộ đã xịn hơn.", "success");
    },
    
    async deepInteract(idolId, type) {
        document.getElementById('condo-action-modal').style.display = 'none';
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        let msg = "";
        let affinityGain = 0;
        let stressChange = 0;
        let visualGain = 0;
        let fameGain = 0;
        
        if (type === 'cook') {
            affinityGain = 10;
            stressChange = -30;
            this.modifyIdolPhysique(idol, 'weight', 0.5);
            this.modifyIdolPhysique(idol, 'waist', 0.5);
            msg = `🥩 Bạn và ${idol.name} cùng nấu và ăn một bữa tối lãng mạn.\nTâm lý cô ấy được giải tỏa cực mạnh (Nhưng tăng cân nhẹ!).`;
        } else if (type === 'talk') {
            if (idol.stress > 70) {
                this.showToast(`Bị từ chối! ${idol.name} đang quá mệt mỏi và không muốn nói chuyện.`, "error");
                idol.affinity = Math.max(0, idol.affinity - 5);
                dbManager.saveIdolData(idol);
                this.renderCondo();
                return;
            }
            affinityGain = 20;
            stressChange = -10;
            msg = `💬 Hai người đã có một buổi trò chuyện sâu sắc thâu đêm.\nHảo cảm tăng đột biến!`;
        } else if (type === 'practice') {
            visualGain = 5;
            fameGain = 2;
            stressChange = 15;
            msg = `👗 Bạn giám sát ${idol.name} tự luyện tập trước gương.\nCô ấy mệt mỏi nhưng kỹ năng được cải thiện.`;
        } else if (type === 'makeup') {
            visualGain = 15;
            stressChange = -5;
            msg = `💄 Màn Makeup chuyên sâu.\nNhan sắc của ${idol.name} lột xác hoàn toàn!`;
        }
        
        idol.affinity = Math.min(100, (idol.affinity || 30) + affinityGain);
        idol.stress = Math.max(0, Math.min(100, (idol.stress || 0) + stressChange));
        idol.stats.visual = Math.min(100, (idol.stats.visual || 50) + visualGain);
        idol.stats.fame = Math.min(100, (idol.stats.fame || 0) + fameGain);
        
        await dbManager.saveIdolData(idol);
        this.refreshUI();
        this.renderCondo();
        if (gameManager.incrementAction) gameManager.incrementAction();
        
        this.showToast("Tương tác hoàn tất!", "success");
        this.showDialog({
            title: `🚪 TƯƠNG TÁC SÂU`,
            message: `<div style="text-align:left; color:var(--text-main); font-size:14px; line-height:1.6; white-space:pre-line;">${msg}</div>
            <div style="margin-top:15px; font-size: 13px; color:#34d399;">Hiệu ứng: Hảo cảm +${affinityGain} | Stress ${stressChange} | Visual +${visualGain}</div>`,
            type: "info"
        });
    },

    async readSecretDiary(idolId) {
        document.getElementById('condo-action-modal').style.display = 'none';
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        const promptText = `Viết 1 trang nhật ký ngắn (tầm 3-4 câu) của idol tên ${idol.name}. Concept: ${idol.concept}. Stats: Hảo cảm với quản lý (sếp) là ${idol.affinity}/100, Stress ${idol.stress}/100.
Hãy viết dưới góc nhìn của cô ấy, thể hiện tâm tư thầm kín về công việc và tình cảm với "Sếp" (người chơi). Thỉnh thoảng tiết lộ 1 món quà mà cô ấy đang mộng mơ muốn có. Output chỉ text tiếng Việt, giọng điệu phù hợp với ngoại hình/tính cách.`;
        
        this.showToast("Đang bẻ khóa mật mã Nhật ký...", "info");
        
        this.injectKeys();
        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            this.showDialog({
                title: `📖 NHẬT KÝ BÍ MẬT: ${idol.name}`,
                message: `<div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; font-style: italic; color:var(--text-main); font-size: 14px; line-height: 1.6; text-align: left; border-left: 3px solid #ec4899;">
                    "${result.replace(/['"«»*]/g, '').trim()}"
                </div>`,
                type: "info"
            });
        } catch (e) {
            this.showToast("Không thể giải mã nhật ký lúc này.", "error");
        }
    },

    async startWorldTour(idolId) {
        if (gameManager.state.money < 10000) {
            return this.showToast("Bạn cần 10,000 💰 để tổ chức World Tour!", "error");
        }
        
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        if (this.isTaskRunning('world_tour_' + idol.id)) return this.showToast("Model đang đi tour rồi!", 'warning');
        
        document.getElementById('condo-action-modal').style.display = 'none';

        this.showDialog({
            title: "✈️ XÁC NHẬN WORLD TOUR",
            message: `Tổ chức lưu diễn vòng quanh thế giới cho <strong>${idol.name}</strong>.<br><br><strong>Chi phí:</strong> <span style="color:var(--error);">10,000 💰</span><br><strong>Hiệu ứng:</strong> Fame +100, Fans ++ cực mạnh, nhưng <strong>Stress +80!</strong><br><br>Đồng ý xuất phát?`,
            type: "confirm",
            onConfirm: () => {
                gameManager.updateMoney(-10000);
                this.startTask('world_tour_' + idol.id, `Đang đi World Tour: ${idol.name}...`);
                this.showToast(`Trợ lý đang đặt vé máy bay cho ${idol.name}...`, "info");

                const promptText = `${idol.name} (Tên), ${idol.concept} (Phong cách). Cô ấy vừa kết thúc chuyến lưu diễn quốc tế "World Tour" dài ngày.
Viết 3 câu tường thuật như một bản tin tạp chí giải trí (Tiếng Việt) mô tả không khí bùng nổ, sự đón chào của hàng ngàn fan hâm mộ, và 1 chi tiết đắt giá cô ấy làm trên sân khấu.`;

                this.injectKeys();
                
                const processTour = async () => {
                    try {
                        const provider = document.getElementById('logic-provider').value;
                        const service = (provider === 'gemini') ? geminiService : pollinationsService;
                        let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
                        
                        idol.stats.fame += 100;
                        idol.fans = (idol.fans || 0) + Math.floor(Math.random() * 50000) + 50000;
                        idol.stress = Math.min(100, (idol.stress || 0) + 80);
                        
                        await dbManager.saveIdolData(idol);
                        cardEngine.updateTotalFame();
                        this.refreshUI();
                        this.renderCondo();
                        
                        this.showDialog({
                            title: `✈️ WORLD TOUR HOÀN TẤT`,
                            message: `<div style="text-align:left; color:var(--text-main); font-size:14px; line-height:1.6; border-left: 4px solid var(--gold); padding-left: 10px;">
                            ${result.replace(/['"«»*]/g, '').trim()}
                            </div>
                            <div style="margin-top:15px; font-size: 13px; color:#34d399; font-weight:bold;">
                                Hiệu ứng: Danh tiếng (Fame) +100! Số lượng Fan tăng vọt!
                            </div>
                            <div style="margin-top:5px; font-size: 13px; color:var(--error); font-weight:bold;">
                                Cảnh báo: Stress +80! (Hãy cho Model đi Spa ngay lập tức)
                            </div>`,
                            type: "info"
                        });
                    } catch (e) {
                        this.showToast("Chuyến đi gặp trục trặc bão tố!", "error");
                    } finally {
                        this.endTask('world_tour_' + idol.id);
                    }
                };
                processTour();
            }
        });
    },

    async organizeDormParty(btn) {
        if (this.isTaskRunning('dorm_party')) return this.showToast("Đang có party rồi, không thể mở thêm!", 'warning');

        const idols = cardEngine.getAllIdols();
        if (idols.length < 2) {
            return this.showToast("Cần ít nhất 2 Model để tổ chức Party chung khu!", "warning");
        }
        
        if (gameManager.state.money < 1000) {
            return this.showToast("Bạn cần ít nhất 1000 💰 để mua đồ ăn/nước uống tổ chức Party!", "error");
        }
        
        if (btn) {
            btn.disabled = true;
            btn.originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 5px;"></i> ĐANG PARTY...';
            btn.style.opacity = "0.7";
        }
        
        this.startTask('dorm_party', 'Đang tổ chức Dorm Party...');

        gameManager.updateMoney(-1000);
        
        const namesInfo = idols.map(i => i.name + " (" + i.concept + ")").join(", ");
        
        const promptText = `Bạn là đạo diễn. Công ty ảo vừa tổ chức một buổi Dorm Party (Tiệc chung căn hộ) cho các Idol sau: ${namesInfo}. 
Mô phỏng 1 tình huống vui nhộn ngắn gọn (max 4 câu) khi họ đang ăn uống nhậu nhẹt cùng nhau. Output chỉ text tiếng Việt, miêu tả khung cảnh và 1 câu thoại nổi bật của 1 trong các cô gái.`;

        this.showToast("Đang order thức ăn và gọi tất cả Model...", "info");
        
        this.injectKeys();
        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            // Appy global buff
            idols.forEach(idol => {
                idol.stress = 0;
                idol.affinity = Math.min(100, (idol.affinity || 30) + 5);
                this.modifyIdolPhysique(idol, 'weight', 1);
                this.modifyIdolPhysique(idol, 'waist', 1);
                dbManager.saveIdolData(idol);
            });
            this.refreshUI();
            this.renderCondo();
            
            this.showDialog({
                title: `🎉 DORM PARTY!`,
                message: `<div style="text-align:left; color:var(--text-main); font-size:14px; line-height:1.6;">
                ${result.replace(/['"«»*]/g, '').trim()}
                </div>
                <div style="margin-top:15px; font-size: 13px; color:#34d399; font-weight:bold;">
                    Toàn bộ Model ĐÃ PHỤC HỒI STRESS VỀ 0! Hảo cảm chung +5.<br>
                    <span style="color:#ef4444; font-size:12px;">(Ăn nhậu quá đà khiến các Model tăng cân nhẹ!)</span>
                </div>`,
                type: "info"
            });
        } catch (e) {
            this.showToast("Party bị gián đoạn do sự cố điện nước!", "error");
        } finally {
            this.endTask('dorm_party');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = btn.originalText;
                btn.style.opacity = "1";
            }
        }
    },
    async visitCondo(idolId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        this.showToast("Đang gõ cửa...", "info");
        const dialogue = await this.generateCondoDialogue(idol, "visit");
        
        idol.stress = Math.max(0, (idol.stress || 0) - 20);
        idol.affinity = Math.min(100, (idol.affinity || 30) + 5);
        await dbManager.saveIdolData(idol);
        this.refreshUI();
        this.renderCondo();
        
        if (gameManager.incrementAction) gameManager.incrementAction();
        
        this.showDialog({
            title: `🏙️ Căn hộ của ${idol.name}`,
            message: `<div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                <img src="${idol.avatarUrl && idol.avatarUrl !== 'undefined' && !idol.avatarUrl.startsWith('blob:') ? idol.avatarUrl : this.fallbackImage}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; flex: 1;">
                    <strong>${idol.name}:</strong><br>
                    <span style="color:var(--text-main); font-style: italic;">"${dialogue}"</span>
                </div>
            </div>
            <div style="font-size: 13px; color:#34d399; text-align: center;">Hảo cảm +5 | Căng thẳng -20</div>`,
            type: "info",
            onConfirm: () => {
                this.openChat(idolId);
            }
        });
    },

    checkCondoNightEvent() {
        const idols = cardEngine.getAllIdols();
        if (idols.length === 0) return;
        
        // 15% chance to trigger an event if we enter the condo
        if (Math.random() < 0.15) {
            const randomIdol = idols[Math.floor(Math.random() * idols.length)];
            this.triggerRandomCondoEvent(randomIdol);
        }
    },

    async triggerRandomCondoEvent(idol) {
        let isRealText = idol.isReal ? "LƯU Ý ĐẶC BIỆT: Đây là một NGƯỜI NỔI TIẾNG CÓ THẬT TRONG ĐỜI THỰC (Real Life Celebrity). Tình huống gõ cửa đêm nay phải đặc biệt li kỳ và mang hơi hướng rủi ro từ scandal có thật hoặc truyền thông/fan cuồng ngoài đời thực." : "";
        
        const promptText = `Tạo một tình huống ngẫu nhiên "Gõ cửa lúc nửa đêm" xảy ra tại căn hộ của Model ${idol.name}. 
Cô ấy đang có trạng thái (Stress: ${idol.stress}/100, Hảo cảm: ${idol.affinity}/100, Tha hóa: ${idol.corruption}/100).
${isRealText}
Tình huống có thể là khẩn cấp (bị fan cuồng bám theo), hoặc tình cảm mập mờ (say rượu gõ cửa phòng người quản lý), hoặc bất ổn tâm lý (khóc lóc vì một thất bại).
Trả về JSON duy nhất với:
- "title": Tên sự kiện
- "desc": Mô tả sự kiện bằng tiếng Việt
- "choiceA": Lựa chọn an toàn (Ví dụ: Khuyên nhủ nhẹ nhàng)
- "choiceB": Lựa chọn rủi ro (Ví dụ: Cho cô ấy ngủ lại luôn / Dùng bạo lực xử lý fan cuồng / Cho tiền để im lặng)`;

        this.showToast("Cảnh báo: Có tiếng động lạ phát ra từ khu căn hộ...", "warning");
        this.injectKeys();
        
        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            result = result.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const jsonStartIndex = result.indexOf('{');
            const jsonEndIndex = result.lastIndexOf('}');
            if(jsonStartIndex !== -1 && jsonEndIndex !== -1) result = result.substring(jsonStartIndex, jsonEndIndex + 1);
            
            const data = JSON.parse(result);
            
            this.showDialog({
                title: `🚨 SỰ KIỆN NỬA ĐÊM: ${data.title}`,
                message: `<div style="text-align:left; color:var(--text-main); font-size:14px; line-height:1.6; margin-bottom: 20px;">
                ${data.desc}
                </div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn-action w-full" style="background:#34d399; color:#064e3b; font-weight:bold;" onclick="gameApp.resolveNightEvent('${idol.id}', 'A'); document.getElementById('dialog-modal').style.display='none';">${data.choiceA}</button>
                    <button class="btn-action w-full" style="background:#ef4444; color:white; font-weight:bold;" onclick="gameApp.resolveNightEvent('${idol.id}', 'B'); document.getElementById('dialog-modal').style.display='none';">${data.choiceB}</button>
                </div>`,
                type: "info"
            });
        } catch (e) {
            console.error("Night event err", e);
        }
    },

    resolveNightEvent(idolId, choice) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        let msg = "";
        if (choice === 'A') {
            idol.stress = Math.max(0, idol.stress - 15);
            idol.affinity = Math.min(100, idol.affinity + 10);
            msg = `Sự việc được giải quyết ổn thỏa. ${idol.name} cảm thấy an tâm và tin tưởng bạn hơn.\nHảo cảm +10 | Căng thẳng -15`;
            
            if (idol.isReal && Math.random() > 0.5) {
                idol.stats.fame += 20;
                msg += `\n<br><span style="color:var(--gold);">🌟 ĐẶC QUYỀN CELEBRITY: Báo chí khen ngợi cách xử lý chuyên nghiệp của quản lý! Fame +20</span>`;
            }
        } else {
            idol.stress = Math.max(0, idol.stress - 30);
            idol.corruption = Math.min(100, (idol.corruption || 0) + 15);
            idol.affinity = Math.min(100, idol.affinity + 20);
            msg = `Một đêm đầy rủi ro và phá vỡ nguyên tắc. Tuy nhiên ${idol.name} dính líu bạn nhiều hơn.\nHảo cảm +20 | Tha hóa +15 | Căng thẳng -30`;
            
            if (idol.isReal) {
                idol.scandalRisk = Math.min(100, (idol.scandalRisk || 0) + 30);
                idol.stats.scandal_risk = idol.scandalRisk;
                msg += `\n<br><span style="color:var(--error);">🚨 RỦI RO CELEBRITY: Paparazzi đã chộp được khoảnh khắc nhạy cảm ngoài đời thực này! Nguy cơ Phong sát +30%</span>`;
                if (idol.scandalRisk >= 100) {
                    msg += `\n<br><strong style="color:var(--error);">CELEBRITY ĐÃ CHÍNH THỨC BỊ ĐÓNG BĂNG HOẠT ĐỘNG!</strong>`;
                }
            }
        }
        dbManager.saveIdolData(idol);
        this.renderCondo();
        this.refreshUI(idol.id); // Ensure all views are synced
        
        this.showDialog({
            title: "Kết quả", message: msg, type: "info"
        });
    },

    async startLivestream(idolId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;

        this.startTask('livestream_gen', `Đang thiết lập kịch bản Livestream cho ${idol.name}...`);
        this.injectKeys();
        
        const promptText = `Hãy đóng vai AI Livestream Manager. Model ${idol.name} (Phong cách: ${idol.concept}, Fame: ${idol.stats.fame}, Corruption: ${idol.corruption||0}, Stress: ${idol.stress||0}) đang mở một buổi Livestream trên mạng xã hội.
        Hãy tạo một kịch bản Livestream ngắn (Drama/Giao lưu ngẫu nhiên).
        Output ONLY JSON (DO NOT add // comments inside the JSON):
        {
          "liveTitle": "Tiêu đề giật tít livestream",
          "modelQuote": "Câu nói của Model khi chào fan (tiếng Việt)",
          "viewerComments": ["(Tài khoản 1) Trời ơi xinh quá!", "(FanCứng) Nhìn mệt mỏi vậy?", "(Đại gia) Donate 50k!!!"],
          "donateTotal": 5000,
          "fameChange": 150,
          "stressChange": 15
        }
        Lưu ý: Nếu stress cao, viewerComments sẽ phàn nàn, fame có thể giảm. Nếu Corruption cao, Livestream sẽ có thể hơi hở hang, thu hút donate rất lớn nhưng stress/drama cũng tăng lớn. DonateTotal ngẫu nhiên từ 500 -> 20000 tuỳ nhân phẩm và Fame của cổ.`;

        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            this.endTask('livestream_gen');

            let jsonStr = result;
            const match = result.match(/\{[\s\S]*\}/);
            if (match) {
                jsonStr = match[0];
            } else {
                jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
            }
            const data = JSON.parse(jsonStr);
            
            idol.stress = Math.min(100, Math.max(0, (idol.stress || 0) + data.stressChange));
            idol.stats.fame = Math.max(0, idol.stats.fame + data.fameChange);
            idol.fans = Math.max(0, (idol.fans||0) + data.fameChange * 2);
            gameManager.updateMoney(data.donateTotal);
            await dbManager.saveIdolData(idol);
            
            if (gameManager.incrementAction) gameManager.incrementAction();
            this.refreshUI();
            
            const commentsHtml = data.viewerComments.map(c => `<div style="font-size:12px; color:white; background:rgba(255,255,255,0.15); padding:4px 8px; border-radius:10px; margin-bottom:4px; margin-left:-5px;">🗣 ${c}</div>`).join('');

            this.showDialog({
                title: `🔴 <strong>LIVE: ${data.liveTitle}</strong>`,
                message: `<div style="position:relative; width:100%; border-radius:12px; overflow:hidden; background:#000; box-shadow: 0 0 15px rgba(236,72,153,0.5); margin-bottom:15px; display:flex;">
                    <img src="${idol.avatarUrl && idol.avatarUrl !== 'undefined' && !idol.avatarUrl.startsWith('blob:') ? idol.avatarUrl : this.fallbackImage}" style="width: 40%; height:auto; object-fit: cover;">
                    <div style="width:60%; padding:10px; display:flex; flex-direction:column; justify-content: flex-end;">
                        <span style="font-size:11px; color:#ef4444; font-weight:bold; animation: pulse 1s infinite; position:absolute; top:8px; right:10px;">⚫ REC 50.3K 👁️</span>
                        <div style="flex:1;"></div>
                        ${commentsHtml}
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
                    <strong>${idol.name}</strong><br>
                    <span style="color:var(--text-main); font-style: italic;">"${data.modelQuote}"</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; border-top:1px dashed var(--border-color); padding-top:10px; font-size:13px;">
                    <span style="color:var(--gold); font-weight:bold;">Donate: +${data.donateTotal.toLocaleString()} 💰</span>
                    <span style="color:var(--primary); font-weight:bold;">Fans: ${data.fameChange > 0 ? '+'+data.fameChange : data.fameChange}</span>
                    <span style="${data.stressChange > 0 ? 'color:var(--error)' : 'color:var(--success)'}; font-weight:bold;">Stress: ${data.stressChange > 0 ? '+'+data.stressChange : data.stressChange}</span>
                </div>`,
                type: "info"
            });
            
        } catch(e) {
            this.endTask('livestream_gen');
            console.error(e);
            this.showToast("Lỗi kết nối mạng xã hội Livestream, vui lòng thử lại!", "error");
        }
    },
    
    async sendGift(idolId) {
        if (gameManager.state.money < 500) {
            return this.showToast("Không đủ 500 💰 để mua quà!", "error");
        }
        
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        gameManager.updateMoney(-500);
        
        this.showToast("Đang tặng quà...", "info");
        const dialogue = await this.generateCondoDialogue(idol, "gift");
        
        idol.affinity = Math.min(100, (idol.affinity || 30) + 15);
        idol.corruption = Math.max(0, (idol.corruption || 0) - 5);
        
        await dbManager.saveIdolData(idol);
        this.refreshUI();
        this.renderCondo();
        
        if (gameManager.incrementAction) gameManager.incrementAction();
        
        this.showDialog({
            title: `🎁 Tặng quà cho ${idol.name}`,
            message: `<div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                <img src="${idol.avatarUrl && idol.avatarUrl !== 'undefined' && !idol.avatarUrl.startsWith('blob:') ? idol.avatarUrl : this.fallbackImage}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; flex: 1;">
                    <strong>${idol.name}:</strong><br>
                    <span style="color:var(--text-main); font-style: italic;">"${dialogue}"</span>
                </div>
            </div>
            <div style="font-size: 13px; color:#34d399; text-align: center;">Hảo cảm +15 | Tha hóa -5</div>`,
            type: "info"
        });
    },

    async aiAutoJob(idolId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;

        if (!gameManager.currentJobs || gameManager.currentJobs.length === 0) {
            return this.showToast("Bảng hợp đồng KHU GIẢI TRÍ hiện đang trống! Hãy tìm công việc mới trước.", "error");
        }

        // Lock UI / Show loading
        this.startTask('ai_job_decision', `Đang kết nối nhận thức AI... chờ ${idol.name} tự quyết định.`);

        // Prepare Context Options
        const jobsList = gameManager.currentJobs.map(j => 
            `[ID: ${j.id}] ${j.name} | Thù lao: +${j.reward} | Exp: +${j.exp} | Hao mòn (Stress): +${j.stress} | Y.Cầu Danh tiếng: ${j.reqFame}`
        ).join('\n');

        this.injectKeys();
        const promptText = `Bạn đang roleplay một người mẫu tên ${idol.name}. Tính cách: ${idol.concept}. 
Các chỉ số hiện tại của bạn: Danh tiếng: ${idol.stats.fame}, Stress: ${idol.stress || 0}/100, Tha hóa: ${idol.corruption || 0}/100.
Hôm nay công ty đưa ra các hợp đồng sau để bạn tự quyết định:

${jobsList}

Nhiệm vụ của bạn:
1. Đánh giá tình trạng bản thân và chọn MỘT công việc phù hợp nhất (dựa trên danh tiếng yêu cầu, phần thưởng và mức độ stress). Nếu Stress của bạn lớn hơn 80, bạn CÓ QUYỀN TỪ CHỐI không nhận bất cứ việc gì (chọn jobId = "none").
2. Đưa ra 1 câu nói giải thích lý do khi bạn tự quyết định chọn job này với người quản lý (sếp) bằng Tiếng Việt.
3. Viết 1 câu báo cáo kết quả của bạn (với cảm xúc vui, mệt mỏi, hay phàn nàn) dự định sẽ NÓI LUÔN SAU KHI LÀM XONG.

Output BẮT BUỘC theo MỘT JSON DÂY chuyền duy nhất:
{
  "jobId": "...", // ID công việc bạn chọn, hoặc "none" nếu từ chối
  "decisionMessage": "Sếp ơi, em chốt luôn kịch bản này vì...",
  "reportMessage": "Trời ơi làm cái này cực quá sếp ạ, nhưng tiền nhiều thật!"
}`;

        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            this.endTask('ai_job_decision');

            result = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonStartIndex = result.indexOf('{');
            const jsonEndIndex = result.lastIndexOf('}');
            if(jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                result = result.substring(jsonStartIndex, jsonEndIndex + 1);
            }
            
            const decisionData = JSON.parse(result);

            if (decisionData.jobId === "none" || decisionData.jobId === "") {
                this.showDialog({
                    title: `🤖 ${idol.name} Đã Quyết Định (TỪ CHỐI LÀM)`,
                    message: `<p style="font-weight:bold; color:var(--error); margin-bottom: 12px;">Từ chối làm việc!</p>` +
                             `<div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; font-style: italic; color: var(--text-main);">"${decisionData.decisionMessage}"</div>`,
                    type: "info"
                });
                return;
            }

            // Find the job
            const selectedJob = gameManager.currentJobs.find(j => j.id === decisionData.jobId);
            if (!selectedJob) {
                return this.showToast(`${idol.name} kén chọn quá, cô ấy không quyết định được việc nào! (Lỗi ID: ${decisionData.jobId})`, "error");
            }

            // Check if idol meets requirements natively to allow failure logic in the narrative
            if (idol.stats.fame < selectedJob.reqFame) {
                this.showDialog({
                    title: `❌ ${idol.name} Đã Chọn Thất Bại!`,
                    message: `<div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; font-style: italic; color: var(--text-muted); margin-bottom: 12px;">"${decisionData.decisionMessage}"</div>` +
                             `<p style="color:var(--error); font-weight:bold;">Thất bại: Cô ấy cố gắng nhận công việc ${selectedJob.name} nhưng khách hàng đã từ chối thẳng thừng vì độ nổi tiếng Fame chưa đủ (${idol.stats.fame}/${selectedJob.reqFame}).</p>`,
                    type: "info"
                });
                return;
            }

            // Success Selection Narrative
            this.showDialog({
                title: `🤖 ${idol.name} Đã Chốt Lịch Trình!`,
                message: `<div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                    <img src="${idol.avatarUrl && idol.avatarUrl !== 'undefined' && !idol.avatarUrl.startsWith('blob:') ? idol.avatarUrl : this.fallbackImage}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold);">
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; flex: 1;">
                        <strong>${idol.name}:</strong><br>
                        <span style="color:var(--gold); font-style: italic;">"${decisionData.decisionMessage}"</span>
                    </div>
                </div>
                <div style="margin-top: 15px; border-top: 1px dashed var(--border-color); padding-top: 15px; text-align: center;">
                    <p style="color:var(--primary); font-weight:bold; margin-bottom: 10px;">Đang đi làm: ${selectedJob.name}</p>
                    <div style="display:inline-block; margin-top:5px; border-radius:4px; overflow:hidden;" class="loading-spinner"></div>
                </div>`,
                type: "info",
                onConfirm: null 
            });

            // Simulate working time based on stress weight
            const workDuration = Math.min((selectedJob.stress * 100) + 1500, 4000);

            setTimeout(async () => {
                // Remove job from board explicitly to avoid duplicate assigns 
                gameManager.currentJobs = gameManager.currentJobs.filter(j => j.id !== selectedJob.id);

                // Apply rewards
                gameManager.updateMoney(selectedJob.reward);
                idol.stats.fame += 5; // Default some fame increase for working
                
                // Add exp / level up
                if (cardEngine.addExp(idol.id, selectedJob.exp)) {
                    this.showToast(`${idol.name} ĐÃ LÊN CẤP!`, "success");
                }
                
                // Add Stress
                idol.stress = Math.min(100, (idol.stress || 0) + selectedJob.stress);
                
                await dbManager.saveIdolData(idol);
                
                // Update UI elements silently
                if (this.updateUI) this.updateUI();
                this.refreshUI();
                this.renderCondo();
                
                if (gameManager.incrementAction) gameManager.incrementAction();
                
                // Show final report replacing previous state
                const oldDialog = document.getElementById('dialog-overlay');
                if (oldDialog) {
                    oldDialog.style.display = 'none'; // Force hide before new dialog shows
                }

                this.showDialog({
                    title: `💼 BÁO CÁO CÔNG VIỆC: ${selectedJob.name}`,
                    message: `<div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
                        <img src="${idol.avatarUrl && idol.avatarUrl !== 'undefined' && !idol.avatarUrl.startsWith('blob:') ? idol.avatarUrl : this.fallbackImage}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
                        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; flex: 1;">
                            <strong>${idol.name}:</strong><br>
                            <span style="color:var(--text-main); font-style: italic;">"${decisionData.reportMessage}"</span>
                        </div>
                    </div>
                    <div style="font-size: 14px; text-align: center; background: rgba(52, 211, 153, 0.1); padding: 12px; border-radius: 6px; border: 1px dashed var(--success);">
                        <strong style="color:var(--success); font-size: 16px;">THU NHẬP: +${selectedJob.reward} 💰</strong><br>
                        <div style="margin-top: 6px; display: flex; justify-content: space-around;">
                           <span style="color:var(--gold); font-size: 12px;">+${selectedJob.exp} EXP</span>
                           <span style="color:var(--error); font-size: 12px;">Stress: +${selectedJob.stress}%</span>
                        </div>
                    </div>`,
                    type: "info"
                });

            }, workDuration); 

        } catch (e) {
            this.endTask('ai_job_decision');
            console.error("AI Roleplay Job Error: ", e);
            this.showToast("Quá trình kết nối Nhận thức AI thất bại.", "error");
        }
    },

    buySpa(serviceId, price) {
        if(gameManager.state.money < price) {
            return this.showToast("Không đủ tiền sử dụng dịch vụ này!", "error");
        }

        const idols = cardEngine.getAllIdols();
        if(idols.length === 0) return this.showToast("Bạn chưa có Model nào!", "error");

        let selectOptions = idols.map(i => {
           return `<option value="${i.id}">${i.name} - Visual: ${i.stats.visual} | Stress: ${i.stress || 0}</option>`;
        }).join('');

        this.showDialog({
            title: `Sử dụng dịch vụ Spa`,
            message: `Sẽ tiêu tốn ${price} 💰.<br><br>Chọn Model sử dụng:<br><select id="spa-idol-select" class="w-full mt-10 p-2" style="background:var(--bg-elevated); color:white; border:1px solid var(--border-color); border-radius:4px;">${selectOptions}</select>`,
            type: "confirm",
            onConfirm: async () => {
                const selectElement = document.getElementById('spa-idol-select');
                if(!selectElement || !selectElement.value) return;
                const idolId = selectElement.value;
                this.executeSpa(serviceId, price, idolId);
            }
        });
    },

    async executeSpa(serviceId, price, idolId) {
        if(gameManager.state.money < price) {
            return this.showToast("Không đủ tiền!", "error");
        }
        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;

        const tierObj = this.getModelTier(idol);
        const order = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
        const tierLevel = order[tierObj.id];

        if(['spa_vacation', 'spa_plastic'].includes(serviceId) && tierLevel < 3) {
            return this.showToast(`Dịch vụ này chỉ dành cho Model đạt hạng B (Fame > 150) trở lên!`, "error");
        }

        gameManager.updateMoney(-price);

        if(serviceId === 'spa_relax') {
            idol.stress = Math.max(0, (idol.stress || 0) - 50);
        } else if(serviceId === 'spa_skin') {
            idol.stats.visual = Math.min(100, idol.stats.visual + 5);
        } else if(serviceId === 'spa_vacation') {
            idol.stress = 0;
            idol.affinity = Math.min(100, (idol.affinity || 30) + 15);
            this.modifyIdolPhysique(idol, 'weight', 2);
            this.modifyIdolPhysique(idol, 'waist', 1.5);
            // Kèm thông báo hoặc không tuỳ ý. Nhưng do toast bên dưới chung chung nên ko cần.
        } else if(serviceId === 'spa_diet') {
            idol.stress = Math.min(100, (idol.stress || 0) + 15);
            this.modifyIdolPhysique(idol, 'weight', -2);
            this.modifyIdolPhysique(idol, 'waist', -2);
            this.modifyIdolPhysique(idol, 'bust', -1);
            idol.stats.visual = Math.min(100, idol.stats.visual + 2);
        } else if(serviceId === 'spa_gym') {
            idol.stress = Math.min(100, (idol.stress || 0) + 15);
            this.modifyIdolPhysique(idol, 'weight', 1);
            this.modifyIdolPhysique(idol, 'bust', 1);
            this.modifyIdolPhysique(idol, 'hips', 2);
            this.modifyIdolPhysique(idol, 'waist', -1);
            idol.stats.visual = Math.min(100, idol.stats.visual + 3);
        } else if(serviceId === 'spa_plastic') {
            idol.stress = Math.min(100, (idol.stress || 0) + 40);
            idol.corruption = Math.min(100, (idol.corruption || 0) + 20);
            this.modifyIdolPhysique(idol, 'bust', 4);
            this.modifyIdolPhysique(idol, 'hips', 3);
            idol.stats.visual = Math.min(100, idol.stats.visual + 10);
            if (idol.corruption === 100 && (!idol.concept || !idol.concept.includes("Dark Muse"))) {
                idol.concept = (idol.concept || '') + " | Dark Muse";
                this.showToast(`CẢNH BÁO: ${idol.name} ĐÃ BỊ THA HÓA HOÀN TOÀN!`, "error");
            }
        }

        await dbManager.saveIdolData(idol);
        this.refreshUI();
        
        if (document.getElementById('idol-profile-modal').style.display === 'flex') {
            this.openIdolProfile(idol.id);
        }
        
        this.showToast(`Thao tác hoàn tất cho Model: ${idol.name}`, "success");
    },

    renderScoutView() {
        const order = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
        const highestTier = typeof cardEngine !== 'undefined' ? this.getHighestTier() : 'D';
        const tierLevel = order[highestTier];

        const btnPro = document.getElementById('btn-scout-2');
        if (btnPro) {
            if (tierLevel < 2) {
                btnPro.disabled = true;
                btnPro.innerHTML = '🔒 KHÓA (Cần Model Hạng C)';
                btnPro.style.opacity = '0.5';
                btnPro.style.cursor = 'not-allowed';
            } else {
                btnPro.disabled = false;
                btnPro.innerHTML = '💎 CASTING (5K 💰)';
                btnPro.style.opacity = '1';
                btnPro.style.cursor = 'pointer';
            }
        }

        const btnGlobal = document.getElementById('btn-scout-3');
        if (btnGlobal) {
            if (tierLevel < 4) {
                btnGlobal.disabled = true;
                btnGlobal.innerHTML = '🔒 KHÓA (Cần Model Hạng A)';
                btnGlobal.style.opacity = '0.5';
                btnGlobal.style.cursor = 'not-allowed';
            } else {
                btnGlobal.disabled = false;
                btnGlobal.innerHTML = '👑 VIP CASTING (100 💎)';
                btnGlobal.style.opacity = '1';
                btnGlobal.style.cursor = 'pointer';
            }
        }

        // Render Chợ đen / Poached models
        const poachedGrid = document.getElementById('scout-poached-grid');
        if (poachedGrid && typeof cardEngine !== 'undefined') {
            poachedGrid.innerHTML = '';
            const poachedModels = Array.from(cardEngine.poachedRoster.values());
            if (poachedModels.length === 0) {
                poachedGrid.innerHTML = '<p style="color:var(--text-muted); font-size:13px; grid-column:1/-1;">Không có Model nào trong danh sách đen.</p>';
            } else {
                poachedModels.forEach(model => {
                    const cost = 50000;
                    const canAfford = gameManager.state.money >= cost;
                    let safeAvatar = model.avatarUrl && !model.avatarUrl.startsWith('blob:') ? model.avatarUrl : this.fallbackImage;
                    
                    poachedGrid.innerHTML += `
                        <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--error); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <img src="${safeAvatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                                <div>
                                    <h4 style="margin: 0; color: var(--error); font-size: 14px;">${model.name}</h4>
                                    <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Trạng thái: <strong>${model.status === 'poached' ? 'Bị đối thủ cướp' : 'Bị sa thải'}</strong></p>
                                </div>
                            </div>
                            <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                                <span style="color:var(--gold); font-weight:bold; font-size:13px;">${cost.toLocaleString()} 💰</span>
                                <button class="btn-action" style="padding: 5px 10px; background:var(--error); color:white; font-size:11px;" ${canAfford ? '' : 'disabled'} onclick="gameApp.buyBackModel('${model.id}', ${cost})">CHUỘC LẠI</button>
                            </div>
                        </div>
                    `;
                });
            }
        }
    },

    filterShop(category, btnElement) {
        document.querySelectorAll('.shop-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'var(--bg-surface)';
            if (btn.dataset.category !== 'premium') {
                btn.style.color = 'var(--text-main)';
                btn.style.border = '';
            } else {
                btn.style.color = 'var(--secondary)';
            }
        });
        
        btnElement.classList.add('active');
        if (category !== 'premium') {
            btnElement.style.background = 'var(--primary)';
            btnElement.style.color = '#000';
        } else {
            btnElement.style.background = 'var(--secondary)';
            btnElement.style.color = '#000';
        }
        
        this.renderShop(category);
    },

    renderShop(categoryFilter = 'all') {
        const grid = document.getElementById('shop-grid');
        grid.innerHTML = '';
        
        const currentMoney = gameManager.state.money || 0;
        
        // Cập nhật hiển thị tiền trên tiêu đề shop nếu có
        const moneyDisplayElements = document.querySelectorAll('.money-display');
        moneyDisplayElements.forEach(el => {
            if(el.closest('#shop-view')) {
                el.innerHTML = `<span style="color:var(--gold); font-weight:bold;">${currentMoney.toLocaleString()}</span> <span style="font-size:16px;">💰</span>`;
            }
        });
        
        let displayItems = gameManager.shopItems;
        if (categoryFilter !== 'all') {
            displayItems = gameManager.shopItems.filter(i => i.category === categoryFilter);
        }
        
        displayItems.forEach(item => {
            const owned = gameManager.state.inventory[item.id] || 0;
            const div = document.createElement('div');
            div.className = 'shop-item';
            
            const isDiamond = item.currency === 'diamond';
            const canAfford = isDiamond ? gameManager.state.diamonds >= item.price : currentMoney >= item.price;
            const currencyIcon = isDiamond ? '💎' : '💰';
            const priceColor = isDiamond ? '#60a5fa' : '#faca15'; // Blue for diamond, gold for money
            
            let useButtonHtml = owned > 0 
                ? `<button class="btn-action w-full mt-10" style="background-color: var(--secondary); color: white;" onclick="gameApp.openUseItem('${item.id}')">SỬ DỤNG (${owned})</button>`
                : '';

            div.innerHTML = `
                <div style="display: flex; flex-direction: column; height: 100%;">
                    <h4 style="margin: 0 0 8px 0; color: var(--gold); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">${item.name}</h4>
                    <p style="flex-grow: 1; font-size: 13px; color: var(--text-main); margin: 0 0 16px 0; line-height: 1.5;">${item.desc}</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: ${canAfford ? priceColor : '#ef4444'}; font-weight: bold; font-size: 16px;">${item.price.toLocaleString()} ${currencyIcon}</span>
                        <span style="font-size: 12px; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">Kho: ${owned}</span>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button class="btn-action w-full" style="${canAfford ? 'background: var(--primary); color: #000;' : 'background: rgba(255,255,255,0.1); color: var(--text-muted); cursor: not-allowed;'}" onclick="gameApp.buyItem('${item.id}')" ${!canAfford ? 'disabled' : ''}>MUA NGAY</button>
                        ${useButtonHtml}
                    </div>
                </div>
            `;
            grid.appendChild(div);
        });
    },

    _checkLevelUp(idol) {
        let levelUpStr = "";
        if (idol.exp >= 100) {
            idol.level = (idol.level || 1) + 1;
            idol.exp -= 100;
            levelUpStr = `🎉 Model đã lên cấp ${idol.level}!`;
            if (typeof gameManager !== 'undefined') gameManager.checkAchievement('LEVEL_UP', idol);
        }
        return levelUpStr;
    },

    openUseItem(itemId) {
        // Đóng ngay hộp thoại hiện tại (túi đồ) để hộp thoại chọn Model có thể hiển thị ngay lập tức
        const modal = document.getElementById('dialog-modal');
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        }

        const item = gameManager.shopItems.find(i => i.id === itemId);
        if(!item) return;

        const owned = gameManager.state.inventory[itemId] || 0;
        if (owned <= 0) {
            return this.showToast("Bạn không có vật phẩm này!", "error");
        }

        if (item.type === 'exchange_money') {
            // Apply immediately without selecting an idol
            gameManager.state.inventory[itemId] -= 1;
            gameManager.updateMoney(item.effect);
            gameManager.save();
            this.showToast(`Bao tải rủng rỉnh! Mở ra được ${item.effect.toLocaleString()} 💰`, "success");
            this.renderShop();
            return;
        }

        const idols = cardEngine.getAllIdols();
        if(idols.length === 0) return this.showToast("Bạn chưa có Model nào!", "error");

        let selectOptions = idols.map(i => {
           return `<option value="${i.id}">${i.name} - LV.${i.level || 1} | Visual: ${i.stats.visual} | Stress: ${i.stress || 0}</option>`;
        }).join('');

        this.showDialog({
            title: `Sử dụng: ${item.name}`,
            message: `<strong>Tác dụng:</strong> ${item.desc}<br><br>Chọn Model để sử dụng:<br><select id="use-item-idol-select" class="w-full mt-10 p-2" style="background:var(--bg-elevated); color:white; border:1px solid var(--border-color); border-radius:4px;">${selectOptions}</select>`,
            type: "confirm",
            onConfirm: () => {
                const selectElement = document.getElementById('use-item-idol-select');
                if(!selectElement || !selectElement.value) return;
                const idolId = selectElement.value;
                this.executeUseItem(itemId, idolId);
            }
        });
    },

    async executeUseItem(itemId, idolId) {
        const item = gameManager.shopItems.find(i => i.id === itemId);
        if(!item) return;

        if (!gameManager.state.inventory[itemId] || gameManager.state.inventory[itemId] <= 0) {
            return this.showToast("Không đủ vật phẩm!", "error");
        }

        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;

        // Trừ vật phẩm
        gameManager.state.inventory[itemId] -= 1;
        gameManager.save();

        // Áp dụng tác dụng
        if (item.type === 'stress') {
            idol.stress = Math.max(0, (idol.stress || 0) + item.effect);
        } else if (item.type === 'stress_heavy') {
            idol.stress = Math.max(0, (idol.stress || 0) + item.effect);
            idol.corruption = Math.min(100, (idol.corruption || 0) + 5);
        } else if (item.type === 'weight_down') {
            if (idol.measurements && idol.measurements.weight) {
                let currentStr = idol.measurements.weight.toString();
                let match = currentStr.match(/\d+(\.\d+)?/);
                if (match) {
                    let num = parseFloat(match[0]);
                    let newVal = Math.max(10, num + item.effect); // item.effect is like -1 or -2
                    newVal = Math.round(newVal * 10) / 10;
                    idol.measurements.weight = currentStr.replace(match[0], newVal);
                }
            }
            idol.stress = Math.max(0, (idol.stress || 0) - 10);
        } else if (item.type === 'weight_fast') {
            if (idol.measurements && idol.measurements.weight) {
                let currentStr = idol.measurements.weight.toString();
                let match = currentStr.match(/\d+(\.\d+)?/);
                if (match) {
                    let num = parseFloat(match[0]);
                    let newVal = Math.max(10, num + item.effect);
                    newVal = Math.round(newVal * 10) / 10;
                    idol.measurements.weight = currentStr.replace(match[0], newVal);
                }
            }
            idol.stress = Math.min(100, (idol.stress || 0) + 30);
            idol.corruption = Math.min(100, (idol.corruption || 0) + 10);
        } else if (item.type === 'affinity') {
            idol.affinity = Math.min(100, (idol.affinity || 30) + item.effect);
        } else if (item.type === 'visual') {
            idol.stats.visual = Math.min(100, idol.stats.visual + item.effect);
            idol.mood = "Vui vẻ";
        } else if (item.type === 'gift_luxury') {
            idol.affinity = Math.min(100, (idol.affinity || 30) + item.effect);
            idol.stats.visual = Math.min(100, idol.stats.visual + 15);
            idol.stress = Math.max(0, (idol.stress || 0) - 20);
            idol.mood = "Hạnh phúc";
        } else if (item.type === 'exp') {
            idol.exp = (idol.exp || 0) + item.effect;
            this._checkLevelUp(idol);
        } else if (item.type === 'exp_high') {
            idol.exp = (idol.exp || 0) + item.effect;
            idol.stats.fame = (idol.stats.fame || 0) + 5;
            this._checkLevelUp(idol);
        } else if (item.type === 'gift_diamond') {
            idol.affinity = Math.min(100, (idol.affinity || 30) + item.effect);
            idol.stats.visual = Math.min(100, idol.stats.visual + 30);
            idol.stress = 0;
            idol.mood = "Vô cùng hạnh phúc";
        } else if (item.type === 'media_vip') {
            idol.stats.fame = Math.min(100, (idol.stats.fame || 0) + item.effect);
            idol.scandalRisk = Math.max(0, (idol.scandalRisk || 0) - 30);
            idol.stats.scandal_risk = idol.scandalRisk;
            idol.corruption = Math.max(0, (idol.corruption || 0) - 10);
            idol.fans = (idol.fans || 0) + 2000;
        } else if (item.type === 'fame_boost') {
            idol.stats.fame += item.effect;
            idol.fans = (idol.fans || 0) + 10000;
        } else if (item.type === 'clear_scandal') {
            idol.scandalRisk = Math.max(0, (idol.scandalRisk || 0) + item.effect);
            idol.stats.scandal_risk = idol.scandalRisk;
            idol.corruption = Math.max(0, (idol.corruption || 0) - 20);
        } else if (item.type === 'shoes_visual') {
            if (!idol.shoes) idol.shoes = [];
            if (!idol.shoes.find(o => o.id === itemId)) {
                idol.shoes.push({ id: itemId, name: item.name, promptEffect: item.promptEffect || '' });
            } else {
                gameManager.state.inventory[itemId] += 1;
                return this.showToast(`${idol.name} đã có giày này! (Hoàn lại kho)`, "warning");
            }
            idol.stats.visual = Math.min(100, (idol.stats.visual || 50) + item.effect);
            idol.stats.fame += (item.effect === 20 ? 5 : 10);
            idol.fans = (idol.fans || 0) + (item.effect === 20 ? 500 : 1000);
        } else if (item.type === 'shoes_active') {
            if (!idol.shoes) idol.shoes = [];
            if (!idol.shoes.find(o => o.id === itemId)) {
                idol.shoes.push({ id: itemId, name: item.name, promptEffect: item.promptEffect || '' });
            } else {
                gameManager.state.inventory[itemId] += 1;
                return this.showToast(`${idol.name} đã có giày này! (Hoàn lại kho)`, "warning");
            }
            idol.stats.visual = Math.min(100, (idol.stats.visual || 50) + item.effect);
            idol.stress = Math.max(0, (idol.stress || 0) - 10);
        } else if (item.type === 'outfit') {
            if (!idol.outfits) idol.outfits = [];
            if (!idol.outfits.find(o => o.id === itemId)) {
                idol.outfits.push({ id: itemId, name: item.name, promptEffect: item.effect });
            } else {
                gameManager.state.inventory[itemId] += 1;
                gameManager.save();
                return this.showToast(`${idol.name} đã sở hữu trang phục này! (Hoàn lại kho)`, "warning");
            }
        } else if (item.type === 'accessory') {
            if (!idol.accessories) idol.accessories = [];
            if (!idol.accessories.find(o => o.id === itemId)) {
                idol.accessories.push({ id: itemId, name: item.name, promptEffect: item.effect });
            } else {
                gameManager.state.inventory[itemId] += 1;
                gameManager.save();
                return this.showToast(`${idol.name} đã sở hữu phụ kiện này! (Hoàn lại kho)`, "warning");
            }
        }

        await dbManager.saveIdolData(idol);
        this.refreshUI();
        this.renderShop(); // Update shop UI
        
        if (gameManager.incrementAction) gameManager.incrementAction();
        
        this.showToast(`Sử dụng ${item.name} cho ${idol.name} thành công!`, "success");
        setTimeout(() => this.openInventory(), 100);
    },

    buyItem(id) {
        if(gameManager.buyItem(id)) {
            this.showToast("Mua thành công!", "success");
            this.renderShop();
        } else {
            this.showToast("Không đủ tiền để mua vật phẩm này!", "error");
        }
    },

    renderJobs() {
        const board = document.getElementById('jobs-board');
        board.innerHTML = '';
        if (!gameManager.currentJobs || gameManager.currentJobs.length === 0) {
            board.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:30px;">Hiện tại không có hợp đồng nào. Hãy làm mới!</p>';
            return;
        }
        gameManager.currentJobs.forEach(job => {
            const div = document.createElement('div');
            // Allow CSS to handle the flex direction for responsiveness
            div.className = 'job-card';
            div.style = "padding: 15px; overflow: hidden; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(0,0,0,0.3); background: linear-gradient(145deg, var(--bg-surface), #1a1a1a); margin-bottom: 15px; transition: all 0.3s; align-items: center;";
            div.onmouseover = () => { div.style.transform = 'translateY(-3px)'; div.style.borderColor = 'var(--primary)'; div.style.boxShadow = '0 8px 25px rgba(212,175,55,0.2)'; };
            div.onmouseout = () => { div.style.transform = 'translateY(0)'; div.style.borderColor = 'var(--border-color)'; div.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'; };

            div.innerHTML = `
                <div style="font-size: 45px; filter: drop-shadow(0 2px 5px rgba(212,175,55,0.4)); flex-shrink: 0; min-width: 60px; text-align: center;">${job.icon}</div>
                <div class="job-info">
                    <h3 style="margin: 0 0 10px 0; color: var(--gold); font-size: 18px; letter-spacing: 0.5px; text-transform: uppercase;">${job.name}</h3>
                    <div class="job-reqs" style="gap: 15px;">
                        <span style="display:flex; align-items:center; gap:6px;"><i class="fas fa-star" style="color:var(--gold); font-size:11px;"></i> YC Fame: <strong style="color:#fff; font-family:'JetBrains Mono';">${job.reqFame.toLocaleString()}</strong></span>
                        <span style="display:flex; align-items:center; gap:6px;"><i class="fas fa-exclamation-triangle" style="color:var(--error); font-size:11px;"></i> Mệt: <strong style="color:var(--error); font-family:'JetBrains Mono';">+${job.stress}%</strong></span>
                    </div>
                </div>
                <div class="job-reward" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 130px; background: rgba(212,175,55,0.03); padding: 10px; border-radius: 8px; border: 1px dashed rgba(212,175,55,0.2);">
                    <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; letter-spacing: 1px; font-weight:bold;">Thù lao</div>
                    <div style="color: #34d399; font-size: 20px; font-weight: 800; font-family: 'JetBrains Mono'; text-shadow: 0 0 10px rgba(52,211,153,0.2);">+${job.reward.toLocaleString()} 💰</div>
                    <div style="color: var(--primary); font-weight: bold; font-size: 12px; margin-bottom: 8px; font-family: 'JetBrains Mono';">+${job.exp.toLocaleString()} EXP</div>
                    <button class="btn-action w-full" style="margin: 0; padding: 8px 12px; font-size: 12px; font-weight: 800; letter-spacing: 1px; border-radius: 4px; background: linear-gradient(135deg, var(--bg-elevated), #2a2a2a); border: 1px solid var(--primary); color: var(--primary);" onclick="gameApp.openAssignJob('${job.id}')" onmouseover="this.style.background='var(--primary)'; this.style.color='#000';" onmouseout="this.style.background='linear-gradient(135deg, var(--bg-elevated), #2a2a2a)'; this.style.color='var(--primary)';">GÁN MODEL</button>
                </div>
            `;
            board.appendChild(div);
        });
    },

    refreshJobs() {
        if(gameManager.refreshJobs()) {
            this.showToast("Đã làm mới danh sách hợp đồng!", "success");
            this.renderJobs();
        } else {
            this.showToast("Không đủ 50 💰 để làm mới!", "error");
        }
    },

    openAssignJob(jobId) {
        // Find job
        const job = gameManager.currentJobs.find(j => j.id === jobId);
        if(!job) return;

        // Get eligible idols
        const idols = cardEngine.getAllIdols();
        if(idols.length === 0) return this.showToast("Bạn chưa có Model nào!", "error");

        let selectOptions = idols.map(i => {
           let reason = "";
           let disabled = "";
           
           if (i.scandalRisk >= 100) {
               reason = " (BỊ PHONG SÁT)";
               disabled = "disabled";
           } else if(i.stats.fame < job.reqFame) {
               reason = " (Thiếu Fame)";
               disabled = "disabled";
           } else if((i.stress || 0) + job.stress > 100) {
               reason = " (Quá stress)";
               disabled = "disabled";
           }
           
           return `<option value="${i.id}" ${disabled}>${i.name} - Fame: ${i.stats.fame} / Stress: ${i.stress || 0} ${reason}</option>`;
        }).join('');

        this.showDialog({
            title: `Phân công: ${job.name}`,
            message: `<strong>Phần thưởng:</strong> ${job.reward} 💰 | ${job.exp} EXP<br><strong>Đổi lại:</strong> Trừ ${job.stress} Tâm trạng (Stress).<br><br>Chọn Model:<br><select id="assign-idol-select" class="w-full mt-10 p-2" style="background:var(--bg-elevated); color:white; border:1px solid var(--border-color); border-radius:4px;">${selectOptions}</select>`,
            type: "confirm",
            onConfirm: async () => {
                const selectElement = document.getElementById('assign-idol-select');
                if(!selectElement || !selectElement.value) return;
                const idolId = selectElement.value;
                this.executeJob(jobId, idolId);
            }
        });
    },

    async executeJob(jobId, idolId) {
        const jobIndex = gameManager.currentJobs.findIndex(j => j.id === jobId);
        if(jobIndex === -1) return;
        const job = gameManager.currentJobs[jobIndex];
        
        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;

        // Update stats
        idol.stress = (idol.stress || 0) + job.stress;
        idol.exp = (idol.exp || 0) + job.exp;
        
        let levelUpStr = "";
        if(idol.exp >= 100) {
            idol.level = (idol.level || 1) + 1;
            idol.exp -= 100;
            levelUpStr = `🎉 Model đã lên cấp ${idol.level}!`;
        }
        
        let weightDropStr = "";
        if (idol.measurements && idol.measurements.weight) {
            let currentStr = idol.measurements.weight.toString();
            let match = currentStr.match(/\d+(\.\d+)?/);
            if (match && Math.random() < 0.6) { // 60% chance to lose 1 kg
                let num = parseFloat(match[0]);
                let newVal = Math.max(10, num - 1);
                newVal = Math.round(newVal * 10) / 10;
                idol.measurements.weight = currentStr.replace(match[0], newVal);
                weightDropStr = " (Cân nặng giảm nhẹ)";
            }
        }
        
        await dbManager.saveIdolData(idol);
        gameManager.updateMoney(job.reward);
        
        // Remove job from board
        gameManager.currentJobs.splice(jobIndex, 1);
        this.renderJobs();
        this.refreshUI();
        
        if (gameManager.incrementAction) gameManager.incrementAction();

        this.showToast(`Hoàn thành hợp đồng! Nhận ${job.reward}💰. ${levelUpStr}${weightDropStr}`, "success");
    },
    
    // Inventory Items handler to use on idols
    openInventory() {
        if (!gameManager.state.inventory) gameManager.state.inventory = {};
        const inventory = gameManager.state.inventory;
        let itemsHtml = '';
        let hasItems = false;
        
        Object.keys(inventory).forEach(itemId => {
            const qty = inventory[itemId];
            if (qty > 0) {
                const itemDef = gameManager.shopItems.find(i => i.id === itemId);
                if (itemDef) {
                    hasItems = true;
                    itemsHtml += `
                    <div style="background:rgba(255,255,255,0.05); padding:10px; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border-left:3px solid var(--primary);">
                        <div>
                            <strong style="color:var(--gold);">${itemDef.name}</strong> <span style="background:var(--primary); color:white; padding:2px 6px; border-radius:10px; font-size:11px;">x${qty}</span><br>
                            <span style="font-size:12px;color:var(--text-muted);">${itemDef.desc}</span>
                        </div>
                        <button class="btn-action btn-primary" onclick="gameApp.openUseItem('${itemId}')">Dùng</button>
                    </div>`;
                }
            }
        });

        if (!hasItems) itemsHtml = "<div style='text-align:center; padding: 20px; color: var(--text-muted);'>Hành trang trống rỗng. Hãy mua sắm ở Shop View!</div>";

        this.showDialog({
            title: "🎒 KHO TÀI SẢN & VẬT PHẨM",
            message: `<div style="max-height: 400px; overflow-y: auto; overflow-x:hidden; padding-right:5px;">${itemsHtml}</div>`,
            type: "info"
        });
    },

    dialogQueue: [],

    showDialog({ title = "THÔNG BÁO", message, type = "alert", onConfirm = null }) {
        const modal = document.getElementById('dialog-modal');
        if (modal.style.display === 'flex') {
            this.dialogQueue.push({ title, message, type, onConfirm });
            return;
        }

        document.getElementById('dialog-title').innerHTML = title;
        document.getElementById('dialog-message').innerHTML = message;
        
        const btnCancel = document.getElementById('dialog-btn-cancel');
        const btnConfirm = document.getElementById('dialog-btn-confirm');
        
        if (type === 'confirm') {
            btnCancel.style.display = 'inline-flex';
            btnConfirm.innerText = 'XÁC NHẬN';
        } else {
            btnCancel.style.display = 'none';
            btnConfirm.innerText = 'ĐÓNG';
        }
        
        const closeModals = () => {
            modal.style.display = 'none';
            btnCancel.onclick = null;
            btnConfirm.onclick = null;
            if (this.dialogQueue.length > 0) {
                const nextDialog = this.dialogQueue.shift();
                setTimeout(() => this.showDialog(nextDialog), 300);
            } else {
                setTimeout(() => this.checkPendingEvents(), 500);
            }
        };

        btnCancel.onclick = () => {
            closeModals();
        };
        
        btnConfirm.onclick = () => {
            closeModals();
            if (onConfirm) onConfirm();
        };
        
        modal.style.display = 'flex';
    },

    triggerHardReset() {
        this.showDialog({
            title: `<span style="color:var(--error);">⚠️ XÓA DỮ LIỆU</span>`,
            message: "Thao tác này không thể hoàn tác. Tất cả Model, Hình ảnh, Tiền và Kim cương sẽ bị mất. Bạn có chắc chắn?",
            type: "confirm",
            onConfirm: () => {
                this.showDialog({
                    title: "XÁC NHẬN LẦN 2",
                    message: "Nhấn XÁC NHẬN để tiến hành xóa toàn bộ dữ liệu game?",
                    type: "confirm",
                    onConfirm: () => {
                        localStorage.clear();
                        const req = indexedDB.deleteDatabase("MuseArchitectDB");
                        req.onsuccess = () => window.location.reload();
                        req.onerror = () => window.location.reload();
                        req.onblocked = () => window.location.reload();
                    }
                });
            }
        });
    },

    updateSidebarVisibility() {
        const checkboxes = document.querySelectorAll('#sidebar-customize-container input[type="checkbox"]');
        const defaultPins = ['management', 'jobs', 'shop', 'inventory', 'scout', 'studio'];
        
        let checked = [];
        checkboxes.forEach(cb => {
            if (cb.checked) checked.push(cb.value);
            const btn = document.getElementById(`nav-btn-${cb.value}`);
            if (btn) {
                btn.style.display = cb.checked ? 'flex' : 'none';
            }
        });
        
        // If nothing is initialized yet (load fails or first time), fallback
        if (checked.length === 0) {
             checked = defaultPins;
             checkboxes.forEach(cb => {
                const isDefault = defaultPins.includes(cb.value);
                cb.checked = isDefault;
                const btn = document.getElementById(`nav-btn-${cb.value}`);
                if (btn) btn.style.display = isDefault ? 'flex' : 'none';
             });
        }
        
        this.saveSettings(checked);
    },

    saveSettings(checkedMenus = null) {
        if (!checkedMenus) {
            const checkboxes = document.querySelectorAll('#sidebar-customize-container input[type="checkbox"]');
            checkedMenus = [];
            checkboxes.forEach(cb => { if(cb.checked) checkedMenus.push(cb.value); });
        }
    
        const settings = {
            polliKey: document.getElementById('polli-credential').value,
            polliToggle: document.getElementById('polli-toggle').checked,
            imageModel: document.getElementById('image-model').value,
            audioModel: document.getElementById('audio-model') ? document.getElementById('audio-model').value : 'qwen-tts',
            provider: document.getElementById('logic-provider').value,
            geminiKey: document.getElementById('gemini-key').value,
            geminiModel: document.getElementById('gemini-model').value,
            polliTextModel: document.getElementById('polli-text-model').value,
            uiFont: document.getElementById('ui-font').value,
            pinnedMenus: checkedMenus
        };
        localStorage.setItem('muse_architect_config', JSON.stringify(settings));
        this.injectKeys();
        
        if (settings.uiFont) {
            document.body.setAttribute('data-font', settings.uiFont);
        }
    },

    loadSettings() {
        let config_pinned = null;
        const saved = localStorage.getItem('muse_architect_config');
        if (saved) {
            const config = JSON.parse(saved);
            document.getElementById('polli-credential').value = config.polliKey || '';
            document.getElementById('polli-toggle').checked = config.polliToggle || false;
            document.getElementById('image-model').value = config.imageModel || 'flux';
            const audioEl = document.getElementById('audio-model');
            if (audioEl) audioEl.value = config.audioModel || 'qwen-tts';
            document.getElementById('logic-provider').value = config.provider || 'pollinations';
            document.getElementById('gemini-key').value = config.geminiKey || '';
            if(config.geminiModel) document.getElementById('gemini-model').value = config.geminiModel;
            if(config.polliTextModel) document.getElementById('polli-text-model').value = config.polliTextModel;
            if(config.uiFont) {
                document.getElementById('ui-font').value = config.uiFont;
                document.body.setAttribute('data-font', config.uiFont);
            }
            if(config.pinnedMenus) config_pinned = config.pinnedMenus;
        }
        
        const checkboxes = document.querySelectorAll('#sidebar-customize-container input[type="checkbox"]');
        const defaultPins = ['management', 'jobs', 'shop', 'inventory', 'scout', 'studio'];
        
        checkboxes.forEach(cb => {
            if (config_pinned !== null) {
                cb.checked = config_pinned.includes(cb.value);
            } else {
                cb.checked = defaultPins.includes(cb.value);
            }
            const btn = document.getElementById(`nav-btn-${cb.value}`);
            if (btn) btn.style.display = cb.checked ? 'flex' : 'none';
        });

        this.injectKeys();
    },

    injectKeys() {
        const polliToggle = document.getElementById('polli-toggle').checked;
        const polliInput = document.getElementById('polli-credential').value;

        if (typeof geminiService !== 'undefined') {
            geminiService.setKey(document.getElementById('gemini-key').value);
            geminiService.setModel(document.getElementById('gemini-model').value);
        }

        if (typeof pollinationsService !== 'undefined') {
            pollinationsService.updateCredential(polliToggle ? polliInput : '');
            pollinationsService.setImageModel(document.getElementById('image-model').value);
            const audioEl = document.getElementById('audio-model');
            if (audioEl) pollinationsService.currentAudioModel = audioEl.value;
            pollinationsService.setTextModel(document.getElementById('polli-text-model').value);
        }
    },

    syncUI() {
        const provider = document.getElementById('logic-provider').value;
        const polliToggle = document.getElementById('polli-toggle').checked;
        const statusText = document.getElementById('polli-status-text');
        
        statusText.innerHTML = polliToggle ? '<span class="text-error">Secured</span>' : '<span style="color: #38bdf8;">Free Active</span>';
        
        document.getElementById('gemini-block').classList.toggle('hidden', provider !== 'gemini');
        document.getElementById('polli-text-block').classList.toggle('hidden', provider !== 'pollinations');
        
        this.saveSettings();
        this.renderStudioSelect();
    },

    async init() {
        document.addEventListener('pollen-exhausted', () => {
            const now = new Date();
            const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
            const timeStr = nextHour.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            this.showToast(`Bạn đã hết lượt (phấn hoa) để tạo ảnh/text bảo mật cao. Hệ thống tạm chuyển về chế độ Free. Hãy đợi đến ${timeStr} thì phấn hoa sẽ được làm đầy!`, "warning");
        });
        document.addEventListener('gemini-quota-exhausted', () => {
            this.showToast(`Giới hạn API Gemini đã cạn kiệt! Đang tự động chuyển vùng qua máy chủ Pollinations...`, "warning");
        });

        this.loadSettings();
        try { await dbManager.init(); } catch (e) { console.warn("DB Fallback"); }
        if (typeof gameManager !== 'undefined') gameManager.init();
        try { await cardEngine.init(); } catch (e) { console.warn("Card Engine Fallback"); }    
        
        // Fix legacy scandalRisk sync
        cardEngine.getAllIdols().forEach(idol => {
            if (idol.scandalRisk !== idol.stats?.scandal_risk) {
                // Determine which one is more accurate (usually scandalRisk since it affects gameplay directly)
                const s1 = idol.scandalRisk || 0;
                const s2 = idol.stats?.scandal_risk || 0;
                idol.scandalRisk = Math.max(s1, s2);
                if (!idol.stats) idol.stats = {};
                idol.stats.scandal_risk = idol.scandalRisk;
                dbManager.saveIdolData(idol);
            }
        });

        this.syncUI(); 
        this.refreshUI();
        this.renderAchievements();
        this.renderStudioSelect();
        
        this.switchView('map');
    },

    async triggerAIScout(tier = 'street') {
        const order = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
        const highestTier = typeof cardEngine !== 'undefined' ? this.getHighestTier() : 'D';

        if (tier === 'pro' && order[highestTier] < 2) {
            return this.showToast("Cần tối thiểu 1 Model hạng C để mở khóa Pro Audition!", "error");
        }
        if (tier === 'global' && order[highestTier] < 4) {
            return this.showToast("Cần tối thiểu 1 Model hạng A để mở khóa Global Hunt!", "error");
        }

        const costs = { 'street': 1000, 'pro': 5000, 'global': 100 };
        const costType = tier === 'global' ? 'diamond' : 'money';
        const cost = costs[tier] || 1000;

        if (costType === 'money' && gameManager.state.money < cost) {
            return this.showToast(`Không đủ ${cost.toLocaleString()} 💰 để tiến hành Casting!`, "info");
        }
        if (costType === 'diamond' && gameManager.state.diamonds < cost) {
            return this.showToast(`Không đủ ${cost} 💎 để tổ chức VIP CASTING!`, "info");
        }

        const query = document.getElementById('scout-query').value;
        const btnId = tier === 'street' ? 'btn-scout-1' : (tier === 'pro' ? 'btn-scout-2' : 'btn-scout-3');
        const btn = document.getElementById(btnId);
        
        if (!btn) return;

        let originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "⏳ SCANNING...";
        
        ['btn-scout-1','btn-scout-2','btn-scout-3'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).disabled = true; });

        this.startTask('scouting', `Đang rà soát mạng lưới casting ${tier.toUpperCase()}`);

        this.injectKeys();
        const provider = document.getElementById('logic-provider').value;
        const service = (provider === 'gemini') ? geminiService : pollinationsService;

        let candidate = null;
        try {
            candidate = await cardEngine.generateAIModelProfile(query, provider, service, tier);
        } catch (error) {
            this.showToast(`Tuyển dụng thất bại: ${error.message || 'Lỗi API'}`, "error");
            ['btn-scout-1','btn-scout-2','btn-scout-3'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).disabled = false; });
            btn.textContent = originalText;
            this.renderScoutView();
            this.endTask('scouting');
            return;
        }
        
        this.endTask('scouting');

        if (candidate) {
            this.currentScoutCandidate = candidate;
            this.currentScoutCost = cost;
            this.currentScoutTier = tier;
            document.getElementById('preview-name').innerHTML = candidate.name + (candidate.isReal ? ' <span style="color:#38bdf8; font-size:16px;" title="Real Life Celebrity">☑️</span>' : '');
            document.getElementById('preview-concept').textContent = candidate.concept;
            document.getElementById('preview-nationality').textContent = `[ ${candidate.nationality || 'Unknown'} ]`;
            document.getElementById('preview-bio').textContent = candidate.bio;
            
            document.getElementById('preview-physique').innerHTML = `
                <div style="margin-bottom: 8px; font-weight: bold; color: var(--gold);">${candidate.age ? candidate.age + ' tuổi | ' : ''}${candidate.gender || 'Nữ'} - LV.${candidate.level || 1}</div>
                ${this.formatPhysique(candidate.measurements)}
            `;

            document.getElementById('preview-fame').textContent = candidate.stats.fame;
            document.getElementById('preview-visual').textContent = candidate.stats.visual;
            document.getElementById('preview-risk').textContent = candidate.stats.scandal_risk;
            document.getElementById('scout-preview-modal').style.display = 'flex';
        } else {
            this.showToast("Casting thất bại. Vui lòng thử lại.", "info");
        }

        ['btn-scout-1','btn-scout-2','btn-scout-3'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).disabled = false; });
        btn.textContent = originalText;
        this.renderScoutView();
        document.getElementById('scout-query').value = '';
    },

    closeScoutPreview() {
        document.getElementById('scout-preview-modal').style.display = 'none';
        this.currentScoutCandidate = null;
        this.currentScoutCost = null;
        this.currentScoutTier = null;
    },

    async confirmScout() {
        if (!this.currentScoutCandidate) return;
        
        document.getElementById('scout-preview-modal').style.display = 'none';
        
        const cost = this.currentScoutCost || 1000;
        const tier = this.currentScoutTier || 'street';

        if (tier === 'global') {
            gameManager.updateDiamonds(-cost);
        } else {
            gameManager.updateMoney(-cost);
        }
        
        this.startTask('finalize_scout', 'Đang thiết kế hình ảnh Avatar cho Model...');
        
        const newModel = await cardEngine.finalizeIdolRecruitment(this.currentScoutCandidate);
        
        this.endTask('finalize_scout');
        
        if (newModel) {
            this.refreshUI();
            this.renderStudioSelect();
            this.showToast(`Ký hợp đồng thành công với ${newModel.name}!`, "success");
            gameManager.checkAchievement('SCOUT');
            if (this.currentScoutTier === 'global') {
                gameManager.checkAchievement('VIP_SCOUT');
            }
        }
        this.currentScoutCandidate = null;
        this.currentScoutCost = null;
        this.currentScoutTier = null;
    },

    async buyBackModel(id, cost) {
        if (gameManager.state.money < cost) {
            return this.showToast(`Không đủ ${cost.toLocaleString()} 💰 để chuộc lại!`, "error");
        }
        
        const success = await cardEngine.unPoachIdol(id);
        if (success) {
            gameManager.updateMoney(-cost);
            this.showToast("Đã chuộc Model thành công! Mối quan hệ quay về 0.", "success");
            
            // Reset some stats
            const idol = cardEngine.getIdol(id);
            if(idol) {
                idol.affinity = 0;
                idol.stress = 0;
                idol.corruption = Math.max(0, (idol.corruption || 0) + 10);
                await dbManager.saveIdolData(idol);
            }
            
            this.refreshUI();
            this.renderStudioSelect();
        } else {
            this.showToast("Lỗi khi chuộc Model.", "error");
        }
    },

    async triggerDeleteIdol(id) {
        const idol = cardEngine.getIdol(id);
        const name = idol ? idol.name : 'Unknown';
        this.showDialog({
            title: `<span style="color:var(--error);">⚠️ SA THẢI MODEL</span>`,
            message: `Bạn có chắc chắn muốn sa thải Model "${name}"? Thao tác này không thể hoàn tác.`,
            type: "confirm",
            onConfirm: async () => {
                const success = await cardEngine.deleteIdol(id);
                if (success) {
                    this.showToast(`Đã chấm dứt hợp đồng với: ${name}`, "info");
                    this.closeIdolProfile();
                    this.refreshUI();
                    this.renderStudioSelect();
                }
            }
        });
    },

    galleryPage: 0,
    hasMoreGallery: false,

    getModelTier(idol) {
        const f = idol.stats?.fame || 0;
        if (f >= 600) return { id: 'S', name: 'Super Muse', color: '#fbbf24', classBase: 'S' };
        if (f >= 300) return { id: 'A', name: 'A-Lister', color: '#f87171', classBase: 'A' };
        if (f >= 150) return { id: 'B', name: 'Professional', color: '#a78bfa', classBase: 'B' };
        if (f >= 50) return { id: 'C', name: 'Rookie', color: '#34d399', classBase: 'C' };
        return { id: 'D', name: 'Trainee', color: '#94a3b8', classBase: 'D' };
    },

    getHighestTier() {
        let highest = 'D';
        const order = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
        cardEngine.getAllIdols().forEach(i => {
            const t = this.getModelTier(i).id;
            if (order[t] > order[highest]) highest = t;
        });
        return highest;
    },

    refreshUI(idolId) {
        this.renderCards();
        if ((idolId || this.currentProfileId) && document.getElementById('idol-profile-modal').style.display === 'flex') {
            this.openIdolProfile(this.currentProfileId);
        }
        
        const scoutView = document.getElementById('scout-view');
        if (scoutView && !scoutView.classList.contains('hidden')) {
            this.renderScoutView();
        }
    },

	renderCards() {
        const container = document.getElementById('idol-container');
        if (!container) return;

        const countBadge = document.getElementById('model-count-badge');
        if (countBadge) countBadge.textContent = `${cardEngine.roster.size} MODELS`;

        if (cardEngine.roster.size === 0) {
            container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-surface); border: 2px dashed var(--border-color); border-radius: 8px;">
                <span style="font-size: 40px; display: block; margin-bottom: 20px;">🎬</span>
                <h3 style="color: var(--text-main); margin-bottom: 8px;">Sẵn sàng để trở thành bệ phóng cho các siêu sao?</h3>
                <p style="color: var(--text-muted); font-size: 14px;">Hãy bắt đầu bằng việc tìm kiếm Model đầu tiên của bạn.</p>
                <button class="btn-action btn-primary mt-20" onclick="gameApp.switchView('scout')">🎯 TÌM KIẾM MODEL NGAY</button>
            </div>`;
            return;
        }

        let htmlBuffer = '';
        cardEngine.roster.forEach(idol => {
            if (!idol) return; 

            // Sync legacy risk if needed during rendering to be absolutely safe
            if (idol.scandalRisk !== idol.stats?.scandal_risk) {
                idol.stats.scandal_risk = idol.scandalRisk || 0;
            }

            let safeAvatar = idol.avatarUrl;
            if (!safeAvatar || safeAvatar === 'undefined' || safeAvatar.startsWith('blob:')) { 
                safeAvatar = this.fallbackImage || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzIyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjODg4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4Ij5TQ0FOTklORzwvdGV4dD48L3N2Zz4='; 
            }

            const stress = idol.stress || 0;
            const isScandalous = idol.scandalRisk >= 50;
            const isCancelled = idol.scandalRisk >= 100;
            const isDarkMuse = (idol.concept || '').includes('Dark Muse');
            const tierObj = this.getModelTier(idol);

            htmlBuffer += `
                <div class="idol-card" id="card-${idol.id}" style="padding:0; overflow:hidden; border:none; border-radius: var(--radius-md); box-shadow: 0 4px 20px rgba(0,0,0,0.4); display: flex; flex-direction: column; cursor: pointer; position: relative; transition: all 0.3s;" onclick="gameApp.openIdolProfile('${idol.id}')" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    
                    ${isCancelled ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(20,0,0,0.6); z-index:10; display:flex; align-items:center; justify-content:center; backdrop-filter:grayscale(100%); pointer-events:none;">
                        <div style="background:#000; color:var(--error); padding:8px 20px; border:2px solid var(--error); font-weight:900; transform:rotate(-15deg); font-size:20px; box-shadow:0 0 20px #f00; letter-spacing:2px; text-transform:uppercase;">PHONG SÁT</div>
                    </div>` : ''}
                    
                    <!-- TIER BADGE -->
                    <div style="position:absolute; top:10px; right:10px; background:${tierObj.color}; color:#000; font-weight:900; padding:4px 10px; border-radius:4px; font-size:14px; box-shadow: 0 2px 10px rgba(0,0,0,0.5); z-index:5;">
                        ${tierObj.id}
                    </div>

                    <div style="width: 100%; height: 220px; position:relative;">
                         <img src="${safeAvatar}" style="width:100%; height:100%; object-fit:cover; filter:${isCancelled ? 'brightness(0.4) grayscale(100%)' : (isDarkMuse ? 'contrast(1.2) brightness(0.8) hue-rotate(320deg)' : 'brightness(0.9)')};">
                         <div style="position:absolute; top:-1px; left:-1px; background: ${isDarkMuse ? 'rgba(200,0,0,0.8)' : 'linear-gradient(135deg, var(--primary), #8b6d19)'}; padding:5px 12px; border-bottom-right-radius:10px; font-family: 'JetBrains Mono'; font-weight:bold; color:#000; font-size:12px; box-shadow: 2px 2px 5px rgba(0,0,0,0.5);">LV ${idol.level || 1}</div>
                         
                         <div style="position:absolute; bottom:0; padding:40px 15px 15px; width:100%; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                             <h4 style="margin:0 0 4px 0; font-size: 18px; color:${isDarkMuse ? '#ff4d4d' : '#fff'}; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${idol.name}${idol.isReal ? ' <span style="font-size:14px;color:#38bdf8;" title="Real Life Celebrity">☑️</span>' : ''}</h4>
                             <div style="font-size:11px; color:var(--primary); font-weight:600; text-transform: uppercase;">[ ${idol.nationality || 'Unknown'} ]</div>
                             <div style="font-size:11px; color:#ccc; font-weight:600; text-shadow:1px 1px 2px #000; text-transform: uppercase;">${idol.concept || 'Trainee'}</div>
                         </div>
                    </div>
                    
                    <div style="padding: 16px; background: var(--bg-surface); flex: 1; display:flex; flex-direction:column; gap:12px; border-top: 2px solid ${isDarkMuse ? '#ff4d4d' : 'var(--primary)'};">
                        
                        <div style="display:flex; justify-content: space-between; font-size:13px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom:6px;">
                            <span style="color:var(--text-muted); text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">Fans</span>
                            <span style="color:var(--gold); font-weight:800;">${(idol.fans || 0).toLocaleString()}</span>
                        </div>
                        
                        <div style="display:flex; justify-content: space-between; font-size:13px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom:6px;">
                            <span style="color:var(--text-muted); text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">Visual</span>
                            <span style="color:#fff; font-weight:bold;">${idol.stats.visual}</span>
                        </div>
                        
                        <div style="display:flex; flex-direction: column; gap: 4px; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom:6px;">
                            <span style="color:var(--text-muted); text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">Physique</span>
                            <div style="color:rgba(255,255,255,0.9); font-size:11px; font-weight:500; line-height:1.4;">${this.formatPhysique(idol.measurements)}</div>
                        </div>
                        
                        <div style="margin-top:auto; padding-top:4px;">
                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px; font-weight:bold;">
                                <span style="color:var(--text-muted); text-transform:uppercase; font-size:10px;">Stress</span>
                                <span style="color:${stress > 60 ? 'var(--error)' : (stress > 30 ? 'var(--gold)' : 'var(--success)')};">${stress}%</span>
                            </div>
                            <div style="background: rgba(0,0,0,0.5); height:4px; border-radius:2px; overflow:hidden;">
                                <div style="height:100%; width:${stress}%; background: ${stress > 60 ? 'var(--error)' : (stress > 30 ? 'var(--gold)' : 'var(--success)')}; box-shadow: 0 0 5px ${stress > 60 ? 'var(--error)' : 'transparent'};"></div>
                            </div>
                        </div>
                        
                        ${isScandalous && !isCancelled ? `
                        <div style="margin-top: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--error); border-radius: 4px; overflow: hidden; animation: pulse 2s infinite;">
                            <div style="display: flex; justify-content: space-between; padding: 4px 8px; font-size: 10px; font-weight: 800; color: var(--error); text-transform: uppercase;">
                                <span>⚠️ Scandal Risk</span>
                                <span>${idol.scandalRisk}%</span>
                            </div>
                            <div style="height: 3px; background: rgba(0,0,0,0.3);">
                                <div style="height: 100%; width: ${idol.scandalRisk}%; background: var(--error);"></div>
                            </div>
                        </div>` : ''}
                        ${(!isScandalous && !isCancelled && isDarkMuse) ? `<div style="font-size:10px; color:#fff; background:#8b0000; text-align:center; padding:4px 0; border-radius:4px; margin-top:8px; font-weight:bold; letter-spacing:1px; border:1px solid #ff4d4d;">🌑 DARK MUSE</div>` : ''}
                    </div>
                </div>`;
        });
        container.innerHTML = htmlBuffer;
    },

    formatPhysique(measurements) {
        if (!measurements) return `Chiều cao: <span style="color:var(--text-main)">N/A</span> | Cân nặng: <span style="color:var(--text-main)">N/A</span><br>Số đo: <span style="color:var(--text-main)">N/A</span>`;
        if (typeof measurements === 'string') return measurements;

        let hStr = measurements.height;
        if (typeof hStr === 'number') {
            hStr = hStr >= 100 ? `${Math.floor(hStr/100)}m${hStr%100}` : `${hStr} cm`;
        }
        let wStr = typeof measurements.weight === 'number' ? `${measurements.weight}kg` : measurements.weight;

        return `Chiều cao: <span style="color:var(--text-main)">${hStr}</span> | Cân nặng: <span style="color:var(--text-main)">${wStr}</span><br>Số đo: <span style="color:var(--text-main)">${measurements.bust || '?'} - ${measurements.waist || '?'} - ${measurements.hips || '?'}</span>`;
    },

    async upgradeSkill(id, skillKey, btn = null, fromChat = false) {
        if (gameManager.state.money < 1000) {
            if (fromChat) this.appendMessage('system', `[Hệ thống] Không đủ 1000 💰 để tự động đăng ký học ${skillKey}!`);
            return this.showToast("Cần 1000 💰 để tham gia khoá học nâng cấp kỹ năng!", "error");
        }
        
        const idol = cardEngine.getIdol(id);
        if (!idol) return;

        if (!idol.skills) {
            idol.skills = { catwalk: 1, acting: 1, communication: 1, singing: 1, dancing: 1 };
        }

        if (idol.skills[skillKey] >= 10) {
            if (fromChat) this.appendMessage('system', `[Hệ thống] Kỹ năng ${skillKey} đã đạt LV tối đa!`);
            return this.showToast("Kỹ năng này đã đạt tối đa (LV 10)!", "info");
        }

        if (btn) {
            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerText = "⏳ Đang học...";
            
            // Artificial delay for button feedback
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Deduct money
        gameManager.updateMoney(-1000);
        
        // Upgrade
        idol.skills[skillKey] += 1;
        
        // Effects
        idol.stress = (idol.stress || 0) + 10;
        let extraMsg = "";
        if (Math.random() > 0.5 && idol.stats.visual < 100) {
            idol.stats.visual += 1;
            extraMsg = " | Visual +1";
        }

        await dbManager.saveIdolData(idol);
        this.refreshUI();
        
        // update profile if open
        if (document.getElementById('idol-profile-modal').style.display === 'flex') {
            this.openIdolProfile(id); 
        }
        
        if (fromChat) {
             this.appendMessage('system', `[Hệ thống] Đã tự động trừ 1000 💰 đăng ký học ${skillKey.toUpperCase()}. Đạt LV.${idol.skills[skillKey]} (Stress +10${extraMsg})`);
        } else {
             this.showToast(`Đã nâng cấp ${skillKey.toUpperCase()}! (Stress +10${extraMsg})`, "success");
        }
    },

    openIdolProfile(id) {
        this.currentProfileId = id;
        const idol = cardEngine.getIdol(id);
        if (!idol) return;
        
        let safeAvatar = idol.avatarUrl;
        if (!safeAvatar || safeAvatar === 'undefined' || safeAvatar.startsWith('blob:')) { safeAvatar = this.fallbackImage; }

        let formatedPhysique = this.formatPhysique(idol.measurements);
        
        const genderText = idol.gender ? idol.gender : "Nữ";
        const level = idol.level || 1;
        const exp = idol.exp || 0;
        const tierObj = this.getModelTier(idol);

        const modalBody = document.getElementById('profile-modal-body');
        modalBody.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
                <img src="${safeAvatar}" style="width: 120px; height: 120px; border-radius: var(--radius-lg); object-fit: cover; border: 2px solid var(--primary); flex-shrink: 0;" alt="${idol.name}">
                <div style="flex-grow: 1; min-width: 200px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <h3 style="font-size: 24px; margin: 0; color: var(--text-main); font-weight: 700; letter-spacing: 0;">${idol.name}${idol.isReal ? ' <span style="font-size:16px;color:#38bdf8;" title="Real Life Celebrity">☑️</span>' : ''}</h3>
                            <div style="background:${tierObj.color}; color:#000; font-weight:900; padding:2px 8px; border-radius:4px; font-size:12px;">TIER ${tierObj.id}</div>
                        </div>
                        <div style="font-size: 11px; padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                            ${idol.age ? idol.age + ' tuổi | ' : ''} ${genderText} - <span id="profile-nationality-text">${idol.nationality || 'Unknown'}</span>
                            ${(!idol.nationality || idol.nationality === "Unknown") ? `<button onclick="gameApp.inferNationality('${idol.id}')" style="background: none; border: none; color: var(--gold); cursor: pointer; font-size: 12px; padding: 0;" title="Nội suy bằng AI">🪄</button>` : ''}
                        </div>
                    </div>
                    
                    <div class="idol-concept font-mono" style="margin-top: 8px;">${idol.concept}</div>
                    <div style="margin-top: 12px; font-size: 13px; color: var(--text-muted); font-style: italic;">
                        "Tâm trạng hiện tại: <span style="color:var(--gold); font-weight: 600;">${idol.mood || 'Bình thường'}</span>"
                    </div>
                    
                    <div style="margin-top: 12px; display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-main);">
                        <span style="font-weight: 700; color: var(--success);">LV.${level}</span>
                        <div style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; width: ${exp}%; background: var(--success); transition: width 0.3s;"></div>
                        </div>
                        <span style="color: var(--text-muted); font-size: 10px;">${exp}/100</span>
                    </div>
                    <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                        <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; display: flex; justify-content: space-between;">
                            <span style="color: var(--primary); font-weight:700;">Hảo cảm:</span>
                            <span style="color: var(--primary); font-weight: bold;">${idol.affinity || 30}/100</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; display: flex; justify-content: space-between;">
                            <span style="color: var(--error); font-weight:700;">Căng thẳng:</span>
                            <span style="color: var(--error); font-weight: bold;">${idol.stress || 0}/100</span>
                        </div>
                    </div>
                    <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; background: rgba(239,68,68,0.1); padding: 8px; border-radius: 4px; border: 1px solid rgba(239,68,68,0.3);">
                        <span style="color: #ef4444; font-weight: 700;">♠️ Điểm Tha Hóa:</span>
                        <span style="color: ${(idol.corruption || 0) > 0 ? '#ef4444' : 'var(--text-main)'}; font-weight: bold;">${idol.corruption || 0}/100</span>
                    </div>
                </div>
            </div>

            <div class="measurements-display mt-20 font-mono text-center" style="background: var(--bg-elevated); padding: 12px; border-radius: var(--radius-md); font-size: 13px; color: var(--text-muted); line-height: 1.6;">
                ${formatedPhysique}
            </div>

            <p style="font-size: 14px; color: var(--text-muted); font-style: italic; margin-top: 20px; line-height: 1.6;">${idol.bio}</p>
            
            <div class="stats-grid" style="margin-top: 20px;">
                <div class="stat-item">
                    <div class="stat-label">Fame</div>
                    <div class="stat-value font-mono">${idol.stats.fame}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Fans</div>
                    <div class="stat-value font-mono" style="color:var(--gold);">${(idol.fans || 0).toLocaleString()}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Visual</div>
                    <div class="stat-value font-mono">${idol.stats.visual}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Risk</div>
                    <div class="stat-value font-mono text-error">${idol.scandalRisk || 0}</div>
                </div>
            </div>

            <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--gold); display: flex; align-items: center; gap: 8px;">
                    ✨ TIỀM ẨN TÍNH CÁCH
                </h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${(idol.traits || ["Khó đoán"]).map(t => `<span style="padding: 4px 10px; background: rgba(56, 189, 248, 0.1); color: var(--secondary); border-radius: 4px; font-size: 12px; font-weight: 600;">${t}</span>`).join('')}
                </div>
            </div>

            <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--gold); display: flex; justify-content: space-between; align-items: center;">
                    📐 SKILL TREE
                    <span style="font-size: 11px; color: var(--success); font-weight: 600;">Dùng 1000 💰 để nâng cấp</span>
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" id="profile-skill-tree">
                    ${Object.entries(idol.skills || { catwalk: 1, acting: 1, communication: 1, singing: 1, dancing: 1 }).map(([key, lvl]) => `
                        <div style="background: var(--bg-elevated); padding: 8px 12px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; text-transform: capitalize; color: var(--text-main); font-weight: 600;">${key}</span>
                                <span style="font-size: 13px; font-weight: 700; color: var(--success);">LV.${lvl}</span>
                            </div>
                            <button onclick="gameApp.upgradeSkill('${idol.id}', '${key}', this)" class="btn-action btn-skill w-full" style="padding: 4px; font-size: 11px;">⬆ ĐI HỌC (1000 💰)</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--gold); display: flex; align-items: center; gap: 8px;">
                    👗 KHO ĐỒ (WARDROBE)
                </h4>
                ${(!idol.outfits || idol.outfits.length === 0) ? `<div style="font-size:12px; color:var(--text-muted); font-style:italic;">Chưa có trang phục nào. Hãy mua trong Shop.</div>` : `
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${idol.outfits.map(outfit => `
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 13px; color: var(--text-main); font-weight: 600;">${outfit.name}</div>
                            </div>
                            ${idol.equippedOutfit === outfit.id ? 
                                `<span style="font-size:11px; padding:4px 8px; background:var(--success); color:#000; border-radius:4px; font-weight:bold;">ĐÃ MẶC</span>` : 
                                `<button class="btn-action" style="padding: 4px 10px; font-size: 11px; background:var(--bg-elevated); color:var(--primary); border: 1px solid var(--primary);" onclick="gameApp.equipOutfit('${idol.id}', '${outfit.id}')">MẶC (Equip)</button>`
                            }
                        </div>
                    `).join('')}
                    ${idol.equippedOutfit ? `<button class="btn-action w-full mt-10" style="padding: 6px; font-size: 11px; background:transparent; color:var(--error); border: 1px solid var(--error);" onclick="gameApp.equipOutfit('${idol.id}', null)">CỞI BỎ TRANG PHỤC (Mặc định)</button>` : ''}
                </div>
                `}

                ${(idol.shoes && idol.shoes.length > 0) ? `
                <h4 style="font-size: 14px; margin-top: 20px; margin-bottom: 12px; color: var(--gold); display: flex; align-items: center; gap: 8px;">
                    👠 TỦ GIÀY CAO GÓT
                </h4>
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${idol.shoes.map(shoe => `
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 13px; color: var(--text-main); font-weight: 600;">${shoe.name}</div>
                            ${idol.equippedShoe === shoe.id ? 
                                `<span style="font-size:11px; padding:4px 8px; background:var(--success); color:#000; border-radius:4px; font-weight:bold;">ĐÃ MANG</span>` : 
                                `<button class="btn-action" style="padding: 4px 10px; font-size: 11px; background:var(--bg-elevated); color:var(--primary); border: 1px solid var(--primary);" onclick="gameApp.equipShoe('${idol.id}', '${shoe.id}')">MANG (Equip)</button>`
                            }
                        </div>
                    `).join('')}
                    ${idol.equippedShoe ? `<button class="btn-action w-full mt-10" style="padding: 6px; font-size: 11px; background:transparent; color:var(--error); border: 1px solid var(--error);" onclick="gameApp.equipShoe('${idol.id}', null)">CỞI GIÀY CAO GÓT (Mặc định)</button>` : ''}
                </div>` : ''}

                ${(idol.accessories && idol.accessories.length > 0) ? `
                <h4 style="font-size: 14px; margin-top: 20px; margin-bottom: 12px; color: var(--gold); display: flex; align-items: center; gap: 8px;">
                    💎 TRANG SỨC & PHỤ KIỆN
                </h4>
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${idol.accessories.map(acc => `
                        <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 13px; color: var(--text-main); font-weight: 600;">${acc.name}</div>
                            ${idol.equippedAccessory === acc.id ? 
                                `<span style="font-size:11px; padding:4px 8px; background:var(--success); color:#000; border-radius:4px; font-weight:bold;">ĐÃ ĐEO</span>` : 
                                `<button class="btn-action" style="padding: 4px 10px; font-size: 11px; background:var(--bg-elevated); color:var(--primary); border: 1px solid var(--primary);" onclick="gameApp.equipAccessory('${idol.id}', '${acc.id}')">ĐEO (Equip)</button>`
                            }
                        </div>
                    `).join('')}
                    ${idol.equippedAccessory ? `<button class="btn-action w-full mt-10" style="padding: 6px; font-size: 11px; background:transparent; color:var(--error); border: 1px solid var(--error);" onclick="gameApp.equipAccessory('${idol.id}', null)">THÁO PHỤ KIỆN</button>` : ''}
                </div>` : ''}
            </div>

            <div class="trend-alert mt-20">📡 <strong>Latest Trend:</strong> "${idol.latestTrend || 'Chưa có thông tin cập nhật.'}"</div>
            
            <div class="action-group mt-20" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button class="btn-action btn-accent w-full" onclick="gameApp.openChat('${idol.id}')">💬 TRÒ CHUYỆN</button>
                <button id="btn-update-modal-${idol.id}" class="btn-action btn-primary w-full" onclick="gameApp.triggerUpdateIdol('${idol.id}')">CẬP NHẬT TREND</button>
                <button class="btn-action" style="background: linear-gradient(135deg, #f59e0b, #d946ef); color:white; border:none;" onclick="gameApp.openMuseGram('${idol.id}')">🌐 MUSEGRAM</button>
                ${(idol.affinity || 0) >= 80 ? 
                    `<button class="btn-action" style="background:#e11d48; color:white; border:none;" onclick="gameApp.openDating('${idol.id}')">🥂 HẸN HÒ (VIP)</button>` : 
                    `<button class="btn-action" style="background:var(--bg-elevated); color:var(--text-muted); border:1px dashed var(--border-color);" disabled>🥂 HẸN HÒ (CẦN 80 HẢO CẢM)</button>`
                }
            </div>
            
            <button class="btn-action w-full mt-12" style="background:#4a0f12; color:#ef4444; border: 1px solid #ef4444;" onclick="gameApp.triggerDeleteIdol('${idol.id}')">🚫 SA THẢI MODEL</button>
            <button class="btn-action w-full mt-10" style="background:var(--bg-surface); color:var(--text-main);" onclick="gameApp.closeIdolProfile()">✖ ĐÓNG HỒ SƠ</button>
        `;

        document.getElementById('idol-profile-modal').style.display = 'flex';
    },

    equipOutfit(idolId, outfitId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        idol.equippedOutfit = outfitId;
        dbManager.saveIdolData(idol);
        
        if (outfitId) {
            const outfit = idol.outfits.find(o => o.id === outfitId);
            this.showToast(`Đã mặc ${outfit ? outfit.name : 'trang phục'}!`, "success");
        } else {
            this.showToast("Đã cởi trang phục.", "info");
        }
        
        this.openIdolProfile(idolId);
    },

    equipShoe(idolId, shoeId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        idol.equippedShoe = shoeId;
        dbManager.saveIdolData(idol);
        
        if (shoeId) {
            const shoe = idol.shoes.find(o => o.id === shoeId);
            this.showToast(`Đã mang ${shoe ? shoe.name : 'giày'}!`, "success");
        } else {
            this.showToast("Đã cởi giày.", "info");
        }
        
        this.openIdolProfile(idolId);
    },

    equipAccessory(idolId, accId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        idol.equippedAccessory = accId;
        dbManager.saveIdolData(idol);
        
        if (accId) {
            const acc = idol.accessories.find(o => o.id === accId);
            this.showToast(`Đã đeo ${acc ? acc.name : 'phụ kiện'}!`, "success");
        } else {
            this.showToast("Đã tháo trang sức.", "info");
        }
        
        this.openIdolProfile(idolId);
    },

    closeIdolProfile() {
        document.getElementById('idol-profile-modal').style.display = 'none';
    },

    currentChatIdol: null,
    async openChat(id) {
        this.closeIdolProfile();
        const idol = cardEngine.getIdol(id);
        if (!idol) return;
        this.currentChatIdol = idol;
        
        document.getElementById('chat-title').textContent = idol.name;
        document.getElementById('chat-mood').textContent = `Tâm trạng: ${idol.mood || 'Bình thường'}`;
        
        // Cập nhật bối cảnh không gian chat
        const chatModalContent = document.querySelector('#chat-modal .chat-content');
        if (chatModalContent) {
            chatModalContent.style.filter = '';
            chatModalContent.style.background = '';
            chatModalContent.style.border = '';
            chatModalContent.style.boxShadow = '';
            if (idol.corruption && idol.corruption >= 80) {
                chatModalContent.style.background = 'linear-gradient(135deg, #1a0000, #0a0000)';
                chatModalContent.style.border = '1px solid #ef4444';
                chatModalContent.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
            } else if (idol.corruption && idol.corruption >= 50) {
                chatModalContent.style.background = 'linear-gradient(135deg, #2b0b1a, #0d0107)';
                chatModalContent.style.border = '1px solid #ec4899';
            } else if (idol.stress && idol.stress >= 70) {
                chatModalContent.style.background = 'linear-gradient(135deg, #1f2937, #030712)';
                chatModalContent.style.filter = 'grayscale(30%)';
                chatModalContent.style.border = '1px solid #4b5563';
            } else if (idol.affinity && idol.affinity >= 70) {
                chatModalContent.style.background = 'linear-gradient(135deg, #162440, #040914)';
                chatModalContent.style.border = '1px solid #3b82f6';
                chatModalContent.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.2)';
            } else {
                chatModalContent.style.background = 'var(--bg-surface)';
            }
        }
        
        let safeAvatar = idol.avatarUrl;
        if (!safeAvatar || safeAvatar === 'undefined' || safeAvatar.startsWith('blob:')) { safeAvatar = this.fallbackImage; }
        document.getElementById('chat-avatar').src = safeAvatar;

        const messagesBox = document.getElementById('chat-messages');
        messagesBox.innerHTML = '';
        
        document.getElementById('chat-modal').style.display = 'flex';

        // Greet dynamically based on mood and affinity
        this.generateDynamicGreeting(idol);
    },

    async generateDynamicGreeting(idol) {
        const typingId = 'typing-greeting' + Date.now();
        this.appendMessage('model', 'typing', typingId);
        
        const provider = document.getElementById('logic-provider').value;
        let service = (provider === 'gemini') ? geminiService : pollinationsService;
        
        const mood = idol.mood || "Bình thường";
        const affinity = idol.affinity || 30;
        const prompt = `Bạn đang roleplay Model tên ${idol.name}. Tâm trạng hiện tại: ${mood}. Độ hảo cảm với sếp/quản lý: ${affinity}/100.
        Viết đúng 1 CÂU CHÀO NGẮN GỌN khi sếp vừa bước vào phòng làm việc. 
        Nếu hảo cảm thấp: xa cách, xã giao, hoặc khó chịu.
        Nếu hảo cảm cao: vui vẻ, nhõng nhẽo, gọi thân mật.
        Chỉ trả về câu trả lời, không cần phân tích.`;
        
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("API Timeout")), 8000));
            const fetchPromise = (provider === 'gemini') ? service.generateContent(prompt) : service.generateText(prompt, `You are ${idol.name}`);
            let res = await Promise.race([fetchPromise, timeoutPromise]);
            
            document.getElementById(typingId)?.remove();
            this.appendMessage('model', res.replace(/"/g, ''));
        } catch (e) {
            document.getElementById(typingId)?.remove();
            const greetings = {
                "Vui vẻ": "Xin chào sếp! Có lịch trình gì mới cho em không?",
                "Mệt mỏi": "Em chào sếp... dạo này em hơi đuối...",
                "Căng thẳng": "Haizz... Chào sếp, em đang hơi đau đầu chút...",
                "Bình thường": "Chào sếp, lịch trình hôm nay thế nào ạ?"
            };
            this.appendMessage('model', greetings[mood] || greetings["Bình thường"]);
        }
    },

    closeChat() {
        document.getElementById('chat-modal').style.display = 'none';
        this.currentChatIdol = null;
    },

    appendMessage(role, text, id = null) {
        const messagesBox = document.getElementById('chat-messages');
        const bubble = document.createElement('div');
        if (id) bubble.id = id;
        bubble.className = `chat-bubble ${role}`;
        
        let formattedText = text.replace(/\*(.*?)\*/g, '<em>*$1*</em>');
        
        if (text === 'typing') {
            bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
        } else {
            bubble.innerHTML = formattedText;
        }
        
        messagesBox.appendChild(bubble);
        messagesBox.scrollTo({ top: messagesBox.scrollHeight, behavior: 'smooth' });
    },

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        let text = input.value.trim();
        if (!text || !this.currentChatIdol) return;

        this.appendMessage('user', text);
        input.value = '';
        input.disabled = true;
        
        const typingId = 'typing-' + Date.now();
        this.appendMessage('model', 'typing', typingId);

        this.injectKeys();
        const provider = document.getElementById('logic-provider').value;
        let service = (provider === 'gemini') ? geminiService : pollinationsService;

        const idol = this.currentChatIdol;
        const gender = idol.gender || 'Nữ';
        const level = idol.level || 1;
        
        let mText = "";
        if (idol.measurements && typeof idol.measurements === 'object') {
            mText = `Chiều cao ${idol.measurements.height || '?'}cm, Nặng ${idol.measurements.weight || '?'}kg, Số đo: ${idol.measurements.bust || '?'}-${idol.measurements.waist || '?'}-${idol.measurements.hips || '?'}`;
        } else {
            mText = `${idol.measurements || 'Chưa rõ'}`;
        }

        // Lấy lịch sử chat để làm ngữ cảnh
        const messagesBox = document.getElementById('chat-messages');
        const historyNodes = Array.from(messagesBox.querySelectorAll('.chat-bubble')).slice(-6, -1); // Lấy 5 tin nhắn gần nhất
        const chatHistory = historyNodes.map(node => {
            const isUser = node.classList.contains('user');
            return (isUser ? "Sếp: " : idol.name + ": ") + node.textContent;
        }).join('\n');

        // Context - Enhanced Prompt for Stats Adjustment
        const traitsText = `Tính cách tiềm ẩn: ${(idol.traits || ['Bí ẩn']).join(', ')}. Hãy thể hiện tính cách này trong lời nói.`;

        const promptText = `Bạn đang roleplay một người mẫu (${gender}) tên ${idol.name}. Level: ${level}.
Concept: "${idol.concept}". Sinh hoạt: "${idol.bio}". 
${traitsText}
Đặc điểm: ${mText}. Mood: ${idol.mood || 'Bình thường'}.
Chỉ số: Nhận diện(Fame): ${idol.stats.fame}, Ngoại hình(Visual): ${idol.stats.visual}.
Độ hảo cảm(Affinity) với sếp: ${idol.affinity || 30}/100. Độ căng thẳng(Stress): ${idol.stress || 0}/100. Độ Tha Hóa(Corruption): ${idol.corruption || 0}/100.

LỊCH SỬ CHAT GẦN ĐÂY:
${chatHistory}

Sếp / Quản lý của bạn vừa nói: "${text}"

YÊU CẦU CHO THẾ GIỚI GAME:
1. Bạn có thể sử dụng *hành động nghiêng* (VD: *nháy mắt*, *thở dài*) để tăng tính chân thực.
2. Giọng điệu phụ thuộc MẠNH MẼ vào Độ hảo cảm, Căng thẳng và ĐẶC BIỆT LÀ ĐỘ THA HÓA (Corruption: ${idol.corruption || 0}/100). Hảo cảm thấp (<30): Xa cách. Hảo cảm cao (>70): Thân mật. Căng thẳng cao (>70): Cáu gắt, mệt mỏi. Tha hóa cao (>50): Dâm đãng, thực dụng, mưu mô, buông thả. Tha hóa 100 (Dark Muse): Hoàn toàn sa ngã, lộng ngôn, cám dỗ, coi thường mọi thứ trừ tiền và quyền lực.
3. Thay đổi hình thể: AI hãy nội suy thông số cơ thể tự nhiên theo ngữ cảnh chat thực tế. VD: Nếu làm việc nhiều (đi gym, thể thao, diễn concert, quay phim liên tục...) -> thì số đo nên giảm dần (Cân nặng giảm; Nếu mệt mỏi quá thì Vòng 1, Vòng 3 sụt giảm). Nếu nghỉ ngơi nhiều, ăn uống, du lịch, ít hoạt động -> thì Cân nặng tăng, Vòng bụng (Waist) có xu hướng tăng. Hãy thay đổi các trường new_weight, new_bust, new_waist, new_hips một cách logic nhất so với hiện tại.
4. Tương tác UI bối cảnh: Nếu bối cảnh chat đề cập mua sắm, đề xuất action 'shop'. Nếu đi chụp ảnh, đề xuất 'photo'. Nếu đi làm, đề xuất 'job'. Nghỉ ngơi giải trí chung chung, đề xuất 'spa'. Nếu sếp/model đề cập đích danh: massage thì đề xuất 'spa_relax', chăm sóc da thì 'spa_skin', đi nghỉ dưỡng thì 'spa_vacation', ép cân thì 'spa_diet', đi tập luyện gym cường độ cao thì 'spa_gym'. Nếu sếp yêu cầu ĐI HỌC nâng cao kỹ năng (catwalk, acting, communication, singing, dancing) và bạn ĐỒNG Ý, hãy thêm hành động 'learn_skill_[tên_kỹ_năng]' (ví dụ 'learn_skill_catwalk').
5. Cơ Chế Nhờ Vả/Vòi Vĩnh (Sugar Daddy mechanic): Đặc biệt nếu Tha hóa > 30 hoặc Hảo cảm > 60, bạn thỉnh thoảng (khoảng 20% khả năng) NHÕNG NHẼO VÀ ĐÒI SẾP MUA QUÀ ĐẮT TIỀN (túi hiệu, xe sang, trang sức,...) bằng cách trả về object "buy_request" ở trong JSON. Nếu có vòi quà, tự thêm lời vòi vĩnh vào phần "reply".

PHẢN HỒI DUY NHẤT BẰNG RAW JSON:
{
   "reply": "Câu nói của bạn (*hành động kèm theo* nếu có)",
   "action_summary": "Tóm tắt hành động (VD: Đi tập gym, Cãi sếp...)",
   "new_mood": "Cảm xúc mới nảy sinh",
   "exp_gain": 0,
   "new_weight": 50,
   "new_bust": 88,
   "new_waist": 60,
   "new_hips": 90,
   "fame_change": 0,
   "visual_change": 0,
   "risk_change": 0,
   "affinity_change": 0,
   "stress_change": 0,
   "suggested_ui_actions": ["photo"], // mảng chứa các hành động gợi ý ('photo', 'shop', 'job', 'spa') nếu phù hợp ngữ cảnh, hoặc rỗng
   "buy_request": { "item": "Tên món quà (vd: Xe thể thao)", "price": 5000 }, // object chứa món đồ đắt tiền (1000 - 10000 💰) hoặc null nếu không đòi gì hết.
   "image_prompt": "Nếu suggested_ui_actions có 'photo', DỰA BÁM SÁT VÀO NGỮ CẢNH CUỘC CHAT để suy luận ra 1 prompt tạo ảnh (Tiếng Anh, professional, FULL-BODY SHOT, 8k, cinematic, mô tả rõ trang phục người mẫu đang mặc, bối cảnh và cảm xúc lúc này). ƯU TIÊN GÓC CHỤP TOÀN THÂN (Full-body). Nếu không có photo action, để rỗng."
}`;

        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("API Timeout")), 12000));
            let fetchPromise;
            
            if (provider === 'gemini') {
                fetchPromise = service.generateContent(promptText, { json: true });
            } else {
                fetchPromise = service.generateText(promptText, `You must output raw JSON only.`);
            }
            
            let res = await Promise.race([fetchPromise, timeoutPromise]);
            
            document.getElementById(typingId)?.remove();
            
            let jsonStr = res;
            const match = res.match(/\{[\s\S]*\}/);
            if (match) {
                jsonStr = match[0];
            } else {
                jsonStr = res.replace(/```json/g, '').replace(/```/g, '').trim();
            }
            const data = JSON.parse(jsonStr);
            
            this.appendMessage('model', data.reply || "Dạ sếp!");
            
            let updated = false;
            let sysActions = [];
            
            if (data.action_summary) sysActions.push(data.action_summary);
            
            if (data.new_mood && data.new_mood !== idol.mood) {
                idol.mood = data.new_mood;
                sysActions.push(`Mood -> ${idol.mood}`);
                document.getElementById('chat-mood').textContent = `Tâm trạng: ${idol.mood}`;
                updated = true;
            }
            
            if (typeof idol.measurements === 'object') {
                if(data.new_weight && data.new_weight !== idol.measurements.weight) { idol.measurements.weight = data.new_weight; updated = true; }
                if(data.new_bust && data.new_bust !== idol.measurements.bust) { idol.measurements.bust = data.new_bust; updated = true; }
                if(data.new_waist && data.new_waist !== idol.measurements.waist) { idol.measurements.waist = data.new_waist; updated = true; }
                if(data.new_hips && data.new_hips !== idol.measurements.hips) { idol.measurements.hips = data.new_hips; updated = true; }
            }
            
            // Stats adjusting logic
            if(!idol.stats.fame) idol.stats.fame = 0;
            if(!idol.stats.visual) idol.stats.visual = 0;
            if(!idol.stats.scandal_risk) idol.stats.scandal_risk = 0;
            
            if(data.fame_change > 0) { idol.stats.fame += data.fame_change; sysActions.push(`Fame +${data.fame_change}`); updated = true; }
            if(data.visual_change > 0) { idol.stats.visual += data.visual_change; sysActions.push(`Visual +${data.visual_change}`); updated = true; }
            if(data.risk_change !== 0) { 
                idol.stats.scandal_risk += data.risk_change; 
                // Bounds
                if (idol.stats.scandal_risk < 0) idol.stats.scandal_risk = 0;
                if (idol.stats.scandal_risk > 100) idol.stats.scandal_risk = 100;
                idol.scandalRisk = idol.stats.scandal_risk;
                sysActions.push(`Risk ${data.risk_change > 0 ? '+'+data.risk_change : data.risk_change}`); 
                updated = true; 
            }
            
            if(data.affinity_change !== 0) {
                idol.affinity = (idol.affinity || 30) + data.affinity_change;
                if (idol.affinity < 0) idol.affinity = 0;
                if (idol.affinity > 100) idol.affinity = 100;
                sysActions.push(`💖 ${data.affinity_change >= 0 ? '+'+data.affinity_change : data.affinity_change}`);
                updated = true;
            }

            if(data.stress_change !== 0) {
                idol.stress = (idol.stress || 0) + data.stress_change;
                if (idol.stress < 0) idol.stress = 0;
                if (idol.stress > 100) idol.stress = 100;
                sysActions.push(`⚠️ ${data.stress_change >= 0 ? '+'+data.stress_change : data.stress_change}`);
                updated = true;
            }
            
            if (data.exp_gain > 0) {
                idol.exp = (idol.exp || 0) + data.exp_gain;
                if (idol.exp >= 100) {
                    idol.level = (idol.level || 1) + 1;
                    idol.exp -= 100;
                    this.showToast(`🎉 ${idol.name} ĐÃ LÊN CẤP ${idol.level}!`, "success");
                    sysActions.push(`Level Up! LV.${idol.level}`);
                } else {
                    sysActions.push(`+${data.exp_gain} EXP`);
                }
                updated = true;
            }

            if (sysActions.length > 0) {
                this.appendMessage('system', `[Hệ thống] ${sysActions.join(' | ')}`);
            }
            
            if (data.suggested_ui_actions && Array.isArray(data.suggested_ui_actions)) {
                let actionHtml = `<div class="chat-actions mt-10" style="display:flex; flex-wrap:wrap; gap:8px;">`;
                data.suggested_ui_actions.forEach(act => {
                    if (act === 'photo' && data.image_prompt) {
                         const safePrompt = btoa(unescape(encodeURIComponent(data.image_prompt)));
                         actionHtml += `<button class="btn-action btn-primary" onclick="gameApp.chatTriggerPhoto('${safePrompt}')">📸 CHỤP ẢNH (200 💰)</button>`;
                    } else if (act === 'shop') {
                         actionHtml += `<button class="btn-action" style="background:var(--secondary); color:white;" onclick="gameApp.closeChat(); gameApp.switchView('shop')">🛍️ MUA SẮM</button>`;
                    } else if (act === 'spa') {
                         actionHtml += `
                         <div style="width:100%; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px; margin-top: 4px;">
                             <div style="font-size: 11px; color: var(--gold); margin-bottom: 6px; text-transform:uppercase;">👑 Gợi ý gói Spa / Thư giãn nhanh:</div>
                             <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                 <button class="btn-action" style="flex:1; padding: 6px; background:linear-gradient(135deg, #0f4a22, #082a13); border:1px solid #34d399; color:white; font-size:11px;" onclick="gameApp.executeSpaChat('spa_relax', 100, '${idol.id}', this)">🌿 Massage (100 💰)</button>
                                 <button class="btn-action" style="flex:1; padding: 6px; background:linear-gradient(135deg, #5b1248, #2a0521); border:1px solid #ec4899; color:white; font-size:11px;" onclick="gameApp.executeSpaChat('spa_skin', 300, '${idol.id}', this)">✨ Skincare (300 💰)</button>
                                 <button class="btn-action" style="flex:1; padding: 6px; background:linear-gradient(135deg, #1d4ed8, #0e2978); border:1px solid #60a5fa; color:white; font-size:11px;" onclick="gameApp.executeSpaChat('spa_vacation', 1000, '${idol.id}', this)">🏖️ Chọn Kỳ nghỉ (1000 💰)</button>
                             </div>
                         </div>`;
                    } else if (act.startsWith('spa_')) {
                        let spaPrice = 100;
                        let spaName = "Dịch Vụ Spa";
                        if (act === 'spa_relax') { spaPrice = 100; spaName = "Massage"; }
                        else if (act === 'spa_skin') { spaPrice = 300; spaName = "Chăm sóc da"; }
                        else if (act === 'spa_vacation') { spaPrice = 1000; spaName = "Nghỉ dưỡng"; }
                        else if (act === 'spa_diet') { spaPrice = 1500; spaName = "Ép cân"; }
                        else if (act === 'spa_gym') { spaPrice = 1500; spaName = "Tập Gym"; }
                        
                        actionHtml += `<button class="btn-action" style="background:var(--primary); color:white;" onclick="gameApp.executeSpaChat('${act}', ${spaPrice}, '${idol.id}', this)">🌿 THỰC HIỆN: ${spaName.toUpperCase()} (${spaPrice} 💰)</button>`;
                    } else if (act === 'job') {
                         actionHtml += `<button class="btn-action btn-success" onclick="gameApp.closeChat(); gameApp.switchView('jobs')">🏢 TÌM HỢP ĐỒNG</button>`;
                    } else if (act.startsWith('learn_skill_')) {
                         const skillKey = act.replace('learn_skill_', '');
                         // Tự động gọi nâng cấp skill, thông qua chat
                         setTimeout(() => {
                             gameApp.upgradeSkill(idol.id, skillKey, null, true);
                         }, 500);
                    }
                });
                actionHtml += `</div>`;
                if (actionHtml.includes('<button')) {
                    this.appendMessage('system', `[Hệ thống] Đề xuất tương tác:<br>${actionHtml}`);
                }
            }

            if (data.buy_request && typeof data.buy_request === 'object' && data.buy_request.item) {
                const safeItem = data.buy_request.item.replace(/'/g, "\\'");
                const priceStr = data.buy_request.price.toLocaleString();
                let sponsorHtml = `
                    <div style="background: linear-gradient(135deg, #2b0b1a, #0d0107); border: 1px solid #ec4899; padding: 10px; border-radius: 8px; margin-top: 8px;">
                        <div style="color: #ec4899; font-weight: bold; font-size: 12px; margin-bottom: 5px;">🔥 NHỜ VẢ / VÒI QUÀ 🔥</div>
                        <div style="color: white; font-size: 13px; margin-bottom: 8px;">Model muốn sếp mua: <strong style="color: var(--gold);">${data.buy_request.item}</strong> (${priceStr} 💰)</div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-action" style="flex: 1; padding: 6px; background: var(--success); color: white; font-size: 11px;" onclick="gameApp.handleSponsorRequest('${idol.id}', '${safeItem}', ${data.buy_request.price}, true, this.parentElement.parentElement)">✅ Đồng ý (Tăng Hảo cảm)</button>
                            <button class="btn-action" style="flex: 1; padding: 6px; background: var(--error); color: white; font-size: 11px;" onclick="gameApp.handleSponsorRequest('${idol.id}', '${safeItem}', ${data.buy_request.price}, false, this.parentElement.parentElement)">❌ Khước từ (Giảm Hảo cảm)</button>
                        </div>
                    </div>
                `;
                this.appendMessage('system', sponsorHtml);
            }

            if (updated) {
                await dbManager.saveIdolData(idol);
                this.refreshUI();
            }

        } catch(e) {
            console.error(e);
            document.getElementById(typingId)?.remove();
            this.appendMessage('model', "Xin lỗi sếp, hệ thống giao tiếp đang nghẽn mạng, em chưa xử lý kịp...");
        }

        input.disabled = false;
        input.focus();
    },

    async executeSpaChat(serviceId, price, idolId, btnElement) {
        if (gameManager.state.money < price) {
            return this.showToast("Không đủ tiền thanh toán!", "error");
        }
        // Gọi hàm gốc để trừ tiền và đổi stats
        await this.executeSpa(serviceId, price, idolId);
        
        if (btnElement) {
            btnElement.parentElement.innerHTML = `<span style="color:var(--success);font-size:12px;">Đã tổ chức Spa/Thư giãn!</span>`;
        }

        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;

        // Sinh ra một câu phản hồi nhanh của AI
        const typingId = 'typing-' + Date.now();
        this.appendMessage('model', 'typing', typingId);
        
        try {
            const promptText = `Bạn là model ${idol.name}. Tổ chức quản lý (sếp) vừa chi ${price} tiền để cho bạn đi dịch vụ mã "${serviceId}" (Spa/Thư giãn/Làm đẹp). Hãy nói ngắn gọn (1 câu) phản ứng của bạn (biết ơn, hoặc nũng nịu, hoặc sảng khoái). Trả lời text thường, không chứa JSON.`;
            this.injectKeys();
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            document.getElementById(typingId)?.remove();
            this.appendMessage('model', result.replace(/['"«»*]/g, '').trim());
        } catch (e) {
            document.getElementById(typingId)?.remove();
            this.appendMessage('model', "Trải nghiệm này thật tuyệt, cảm ơn sếp nhiều nha~");
        }
    },

    async handleSponsorRequest(idolId, item, price, isApproved, containerElement) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;

        if (isApproved) {
            if (gameManager.state.money < price) {
                return this.showToast("Sếp không đủ 💰 để mua món này đâu...", "error");
            }
            gameManager.updateMoney(-price);
            idol.affinity = Math.min(100, (idol.affinity || 0) + 15);
            idol.stress = Math.max(0, (idol.stress || 0) - 10);
            this.showToast(`Đã mua ${item} cho ${idol.name}! Hảo cảm tăng mạnh!`, "success");
            containerElement.innerHTML = `<div style="color: var(--success); font-weight: bold; text-align: center;">Đã vung tiền mua ${item} (${price} 💰)!</div>`;
            
            this.appendMessage('model', `Ôi, sếp tuyệt vời quá! Em thích món ${item} này lắm! Cảm ơn sếp yêu~`);
        } else {
            idol.affinity = Math.max(0, (idol.affinity || 0) - 20);
            idol.stress = Math.min(100, (idol.stress || 0) + 15);
            this.showToast(`Đã từ chối mua ${item}. ${idol.name} tỏ ra rất giận dỗi!`, "error");
            containerElement.innerHTML = `<div style="color: var(--error); font-weight: bold; text-align: center;">Đã từ chối thẳng thừng!</div>`;
            
            this.appendMessage('model', `Gì cơ? Có ${price} tiền mà sếp cũng tiếc với em sao? Thật đáng thất vọng...`);
        }
        
        await dbManager.saveIdolData(idol);
        this.refreshUI();
    },

    renderAchievements() {
        const container = document.getElementById('achievements-container');
        if (!container) return;
        container.innerHTML = '';
        
        gameManager.achievementsList.forEach(ach => {
            const isUnlocked = gameManager.state.achievements.includes(ach.id);
            container.innerHTML += `
                <div class="achieve-card ${isUnlocked ? 'unlocked' : ''}">
                    <h4>${ach.title} ${isUnlocked ? '✅' : '🔒'}</h4>
                    <p>${ach.desc}</p>
                    <div class="achieve-reward">Thưởng: ${ach.reward} 💎</div>
                    <div class="achieve-icon">${ach.icon}</div>
                </div>`;
        });
    },

    toggleIdolCard(id) {
        const card = document.getElementById(`card-${id}`);
        if (card) card.classList.toggle('expanded');
    },
    
    renderStudioSelect() {
        const select = document.getElementById('studio-idol-select');
        if (!select) return;
        select.innerHTML = '';
        cardEngine.roster.forEach(idol => { select.innerHTML += `<option value="${idol.id}">${idol.name}</option>`; });
    },

    async triggerUpdateIdol(id) {
        const updateBtn = document.getElementById(`btn-update-modal-${id}`);
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.textContent = "⏳...";
        }

        this.injectKeys();
        const provider = document.getElementById('logic-provider').value;
        const service = (provider === 'gemini') ? geminiService : pollinationsService;
        
        await cardEngine.updateIdolTrend(id, provider, service);
        this.refreshUI();
        
        if (document.getElementById('idol-profile-modal').style.display === 'flex') {
            this.openIdolProfile(id);
        }
        
        this.showToast("Cập nhật Trend thành công", "success");
    },
    
    async inferNationality(id) {
        this.injectKeys();
        const provider = document.getElementById('logic-provider').value;
        const service = (provider === 'gemini') ? geminiService : pollinationsService;
        
        const natText = document.getElementById('profile-nationality-text');
        if (natText) natText.innerHTML = `Đang phân tích...`;
        
        try {
            await cardEngine.inferIdolNationality(id, provider, service);
            this.refreshUI();
            if (document.getElementById('idol-profile-modal').style.display === 'flex') {
                this.openIdolProfile(id);
            }
            this.showToast("Đã cập nhật quốc tịch thành công!", "success");
        } catch (e) {
            this.showToast("Lỗi khi suy luận quốc tịch", "error");
            if (natText) natText.textContent = "Unknown";
        }
    },

    zoomImage() {
        const src = document.getElementById('studio-image').src;
        if (!src) return;
        document.getElementById('zoomed-img').src = src;
        this.currentGalleryViewId = null;
        this.zoomedFromStudio = true;
        
        let btnDelete = document.getElementById('btn-gallery-delete');
        if (btnDelete) btnDelete.style.display = 'none'; // Studio has no delete button in zoom
        
        let btnPublish = document.getElementById('btn-gallery-publish');
        if (btnPublish) {
            btnPublish.style.display = 'inline-flex';
            btnPublish.disabled = false;
            btnPublish.title = "Đăng lên MuseGram";
            btnPublish.style.opacity = '1';
        }

        let existingBadge = document.getElementById('zoom-published-badge');
        if (existingBadge) existingBadge.remove();

        document.getElementById('zoom-modal').style.display = 'flex';
    },

    togglePrompt() {
        document.getElementById('prompt-display').classList.toggle('collapsed');
    },

    async chatTriggerPhoto(b64Prompt) {
        if (gameManager.state.money < 200) {
            return this.showToast("Cần 200 💰 để thiết lập buổi chụp!", "error");
        }
        
        const rawPrompt = decodeURIComponent(escape(atob(b64Prompt)));
        const idol = this.currentChatIdol;
        if (!idol) return;
        
        this.closeChat();
        this.switchView('studio');
        
        // Update studio UI options
        const select = document.getElementById('studio-idol-select');
        if (select) select.value = idol.id;
        
        const conceptInput = document.getElementById('studio-concept');
        if (conceptInput) conceptInput.value = rawPrompt;
        
        this.triggerPhotoshoot();
    },

    async triggerPhotoshoot() {
        if (gameManager.state.money < 200) {
            return this.showToast("Cần 200 💰 để thiết lập buổi chụp!", "info");
        }

        const id = document.getElementById('studio-idol-select').value;
        if (!id) return this.showToast("Cần có Model để chụp hình!", "info");
        
        const idol = cardEngine.getIdol(id);
        if (idol && idol.scandalRisk >= 100) {
            return this.showToast("MODEL ĐÃ BỊ PHONG SÁT, CÁC BRAND SẼ TẨY CHAY!", "error");
        }

        let concept = document.getElementById('studio-concept').value || "Chân dung nghệ thuật sáng tạo";
        const poseElement = document.getElementById('studio-pose');
        if (poseElement && poseElement.value) {
            concept += " | Posed as: " + poseElement.options[poseElement.selectedIndex].text + " (" + poseElement.value + ")";
        }
        
        const defaultImageModel = document.getElementById('image-model').value;
        
        const modelsOptionsHTML = `
            <select id="runtime-image-model" class="w-full mt-10 p-2" style="background:var(--bg-elevated); color:white; border:1px solid var(--border-color); border-radius:4px;">
                <option value="flux" ${defaultImageModel === 'flux' ? 'selected' : ''}>FLUX (Hyper-Realistic)</option>
                <option value="zimage" ${defaultImageModel === 'zimage' ? 'selected' : ''}>ZIMAGE (Cinematic)</option>
                <option value="qwen-image" ${defaultImageModel === 'qwen-image' ? 'selected' : ''}>QWEN (Balanced)</option>
                <option value="gptimage-large" ${defaultImageModel === 'gptimage-large' ? 'selected' : ''}>GPT Image 1.5 (Artistic)</option>
            </select>
        `;

        this.showDialog({
            title: "📸 CHỌN MODEL TẠO ẢNH",
            message: `Chọn AI Render Model để bấm máy (phí: 200 💰):<br>${modelsOptionsHTML}`,
            type: "confirm",
            onConfirm: async () => {
                const imageModel = document.getElementById('runtime-image-model').value;
                this.injectKeys();

                const btn = document.getElementById('btn-shoot');
                const status = document.getElementById('studio-status');
                const img = document.getElementById('studio-image');
                const promptContainer = document.getElementById('prompt-container');
                const tools = document.getElementById('studio-tools');

                btn.disabled = true; 
                img.classList.add('hidden'); 
                tools.classList.add('hidden');
                promptContainer.classList.add('hidden');
                status.style.color = "var(--primary)";
                status.textContent = "AI đang thiết kế bối cảnh điện ảnh...";
                
                this.startTask('photoshoot', 'Đang thiết kế hình ảnh & Render...');

                gameManager.updateMoney(-200);

                const result = await studioDirector.executePhotoshoot(id, concept, imageModel);

                if (result && result.imageUrl) {
                    img.src = result.imageUrl;
                    img.onload = () => {
                        this.endTask('photoshoot');
                        status.textContent = "";
                        img.classList.remove('hidden');
                        tools.classList.remove('hidden');
                        
                        const btnPublish = document.getElementById('btn-studio-publish');
                        if (btnPublish) btnPublish.style.display = '';
                        document.getElementById('prompt-display').innerHTML = `<strong style="color:var(--gold);">[Director's Cut Specs]</strong><br><span style="color:#d1d5db;">${result.technicalSpecs || ''}</span><br><br><strong style="color:var(--primary);">[Lighting & Subject]</strong><br><span style="color:var(--text-muted);">${result.promptUsed}</span>`;
                        promptContainer.classList.remove('hidden');
                        btn.disabled = false;
        
                        this.currentRenderSession = { idolId: id, url: result.imageUrl, prompt: result.promptUsed, saved: false };
                        gameManager.checkAchievement('SHOOT');
                        
                        const idol_updated = cardEngine.getIdol(id);
                        if (idol_updated) {
                            idol_updated.stress = Math.min(100, (idol_updated.stress || 0) + 10);
                            idol_updated.stats.fame += 2;
                            let currentStr = idol_updated.measurements?.weight?.toString() || "";
                            let match = currentStr.match(/\d+(\.\d+)?/);
                            if (match && Math.random() < 0.5) {
                                let num = parseFloat(match[0]);
                                let newVal = Math.max(10, num - 1);
                                newVal = Math.round(newVal * 10) / 10;
                                idol_updated.measurements.weight = currentStr.replace(match[0], newVal);
                            }
                            dbManager.saveIdolData(idol_updated);
                            this.refreshUI();
                            if (gameManager.incrementAction) gameManager.incrementAction();
                        }
        
                        if (this.currentBrandSession) {
                            this.evaluateBrandContract(id, result.promptUsed, this.currentBrandSession);
                        }
                    };
                    img.onerror = () => {
                        this.endTask('photoshoot');
                        img.classList.add('hidden');
                        status.style.color = "var(--error)";
                        status.textContent = "❌ Lỗi Render. Vui lòng thử lại.";
                        btn.disabled = false;
                    };
                } else {
                    this.endTask('photoshoot');
                    status.style.color = "var(--error)";
                    status.textContent = "❌ Hệ thống sinh ảnh bị gián đoạn."; 
                    btn.disabled = false;
                }
            }
        });
    },

    async evaluateBrandContract(idolId, finalPrompt, req) {
        this.currentBrandSession = null;
        const status = document.getElementById('studio-status');
        
        const idol = cardEngine.getIdol(idolId);
        if (!idol || (idol.fans || 0) < req.reqFame) {
            this.showDialog({
                title: `Thất bại: ${req.brand}`,
                message: `Model không đủ fan tối thiểu (${idol.fans || 0}/${req.reqFame} Fans). Nhãn hàng đã hủy hợp đồng!`,
                type: "info"
            });
            gameManager.state.brandRequests.splice(this.currentBrandIndex, 1);
            return;
        }

        status.textContent = "";
        this.startTask('brand_evaluation', `Đang gửi cho ${req.brand} đánh giá kết quả...`);

        const promptText = `Act as an expert Brand Marketing Director for "${req.brand}". 
You requested the following creative direction: "${req.requirement}".
The photographer submitted a photoshoot containing these elements (based on their prompt): "${finalPrompt}".
Critically evaluate how well the submitted photo's elements match your requested creative direction. Consider the mood, color palette, outfit, and overall vibe.
Give a score from 0 to 100. If score >= 80, it's a pass. Provide a short, realistic professional reason (in Vietnamese) explaining what you liked or what was missing.
Output STRICTLY JSON:
{ "score": 85, "reason": "Lý do bằng tiếng Việt...", "isSuccess": true }`;

        this.injectKeys();
        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            this.endTask('brand_evaluation');

            result = result.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const jsonStartIndex = result.indexOf('{');
            const jsonEndIndex = result.lastIndexOf('}');
            if(jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                result = result.substring(jsonStartIndex, jsonEndIndex + 1);
            }
            const data = JSON.parse(result);

            gameManager.state.brandRequests.splice(this.currentBrandIndex, 1);

            status.textContent = "";
            let color = data.isSuccess ? 'var(--gold)' : 'var(--error)';
            let title = data.isSuccess ? `🎉 THÀNH CÔNG: KÝ HỢP ĐỒNG ${req.brand}` : `❌ BỊ TỪ CHỐI BỞI ${req.brand}`;
            let resultInfo = data.isSuccess ? `Chúc mừng! Bạn nhận được ${req.reward.toLocaleString()} 💰` : `Dự án thất bại. Bạn không nhận được tiền.`;

            if (data.isSuccess) {
                if (data.score >= 90 && Math.random() <= 0.3) {
                    let diamondRewardX = Math.floor(Math.random() * 2) + 1;
                    gameManager.updateDiamonds(diamondRewardX);
                    resultInfo += `<br><span style="color:#60a5fa; margin-top:5px; display:inline-block; font-weight:bold;">Dự án xuất thần: Nhận thêm ${diamondRewardX} 💎</span>`;
                }

                gameManager.updateMoney(req.reward);
                idol.exp = (idol.exp || 0) + 500;
                idol.fans = (idol.fans || 0) + 1000;
                await dbManager.saveIdolData(idol);
                this.refreshUI();
            }

            this.showDialog({
                title: `<span style="color:${color};">${title}</span>`,
                message: `<strong>Điểm số:</strong> ${data.score}/100<br><br><strong>Nhận xét:</strong> ${data.reason}<br><br><span style="color:${color}; font-weight:bold;">${resultInfo}</span>`,
                type: "info"
            });
            
        } catch(e) {
            this.endTask('brand_evaluation');
            status.textContent = "Không thể liên lạc với Nhãn hàng.";
        }
    },
    
    async setAsAvatar() {
        if (!this.currentRenderSession) return;
        const { idolId, url } = this.currentRenderSession;
        const success = await cardEngine.updateAvatar(idolId, url);
        if (success) {
            this.refreshUI();
            this.showToast("Đã cập nhật Avatar!", "success");
        }
    },

    async saveToGallery() {
        if (!this.currentRenderSession) return;
        if (this.currentRenderSession.saved) {
            return this.showToast("Ảnh này đã được lưu vào Gallery!", "info");
        }
        
        const { idolId, url, prompt } = this.currentRenderSession;
        try {
            const insertId = await dbManager.savePhoto(idolId, url, prompt);
            if (insertId) {
                this.currentRenderSession.saved = true;
                this.currentRenderSession.photoId = insertId;
                this.showToast("Đã lưu vào Kho dữ liệu an toàn", "success");
                const allPhotos = await dbManager.getAllPhotos();
                gameManager.checkAchievement('PHOTO_SAVED', allPhotos.length);
            } else {
                this.showToast("Trình duyệt không cho phép lưu DB", "info");
            }
        } catch (e) { this.showToast("Lỗi khi lưu ảnh!", "error"); }
    },

    async downloadImage() {
        if (!this.currentRenderSession) return;
        const { url, idolId } = this.currentRenderSession;
        const idol = cardEngine.getIdol(idolId);
        const filename = `${idol ? idol.name.replace(/\s+/g, '_') : 'Model'}_Shoot_${Date.now()}.jpg`;

        this.showToast("Đang chuẩn bị file tải xuống...", "info");
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (e) { window.open(url, '_blank'); }
    },

    openGuide() {
        document.getElementById('guide-modal').style.display = 'flex';
    },

    async openGallery() {
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';
        document.getElementById('gallery-modal').style.display = 'flex';
        
        this.galleryPage = 0;
        this.hasMoreGallery = true;
        
        // Ensure load more wrapper
        let extraContainer = document.getElementById('gallery-extra-controls');
        if (!extraContainer) {
            extraContainer = document.createElement('div');
            extraContainer.id = 'gallery-extra-controls';
            extraContainer.className = 'mt-20';
            grid.parentNode.appendChild(extraContainer);
        }
        extraContainer.innerHTML = '';

        await this.loadMoreGallery();
    },

    async loadMoreGallery() {
        const grid = document.getElementById('gallery-grid');
        const extraContainer = document.getElementById('gallery-extra-controls');
        const limit = 12;
        const offset = this.galleryPage * limit;
        
        if (this.galleryPage === 0) grid.innerHTML = '<div style="color:var(--text-muted);">Đang tải dữ liệu...</div>';
        
        try {
            const photos = await dbManager.getPhotosPaginated(offset, limit);
            
            if (this.galleryPage === 0) grid.innerHTML = ''; // Clear loading text
            
            if (!photos || photos.length === 0) {
                if (this.galleryPage === 0) {
                    grid.innerHTML = '<div style="color:var(--text-muted); grid-column: 1/-1; text-align: center;">Kho lưu trữ trống. Hãy chụp thêm ảnh!</div>';
                }
                this.hasMoreGallery = false;
            } else {
                photos.forEach(photo => {
                    if (photo.imageUrl && photo.imageUrl.startsWith('blob:')) return;
                    const idol = cardEngine.getIdol(photo.idolId);
                    const name = idol ? idol.name : 'Unknown';
                    grid.innerHTML += `
                        <div class="gallery-item" onclick="gameApp.viewGalleryPhoto('${photo.imageUrl ? photo.imageUrl.replace(/'/g, "\\'") : ''}', ${photo.id}, '${photo.idolId}')" title="Click để phóng to">
                            <img src="${photo.imageUrl}" alt="Shoot" loading="lazy">
                            <div class="gallery-overlay font-mono">${name}</div>
                        </div>
                    `;
                });
                
                if (photos.length < limit) {
                    this.hasMoreGallery = false;
                } else {
                    this.galleryPage++;
                }
            }
            
            // Generate Load More button
            extraContainer.innerHTML = '';
            if (this.hasMoreGallery) {
                extraContainer.innerHTML = `<button class="btn-action btn-accent w-full" onclick="gameApp.loadMoreGallery()">TẢI THÊM LỊCH SỬ ▼</button>`;
            }
            
        } catch (e) {
            if (this.galleryPage === 0) grid.innerHTML = '<div style="color:var(--error); grid-column: 1/-1;">Lỗi truy xuất IndexedDB.</div>';
        }
    },

    async viewGalleryPhoto(url, id = null, idolId = null) {
        document.getElementById('zoomed-img').src = url;
        this.currentGalleryViewId = id;
        this.currentGalleryIdolId = idolId;
        this.zoomedFromStudio = false;
        
        let btnDelete = document.getElementById('btn-gallery-delete');
        if (btnDelete) {
            btnDelete.style.display = id ? 'inline-flex' : 'none';
        }

        let btnAvatar = document.getElementById('btn-gallery-avatar');
        if (btnAvatar) {
            btnAvatar.style.display = idolId ? 'inline-flex' : 'none';
        }
        
        let btnPublish = document.getElementById('btn-gallery-publish');
        if (btnPublish) {
            btnPublish.style.display = id ? 'inline-flex' : 'none';
            btnPublish.disabled = false;
            btnPublish.title = "Đăng lên MuseGram";
            btnPublish.style.opacity = '1';
        }

        let existingBadge = document.getElementById('zoom-published-badge');
        if (existingBadge) existingBadge.remove();

        if (id) {
            const photo = await dbManager.getPhoto(id);
            if (photo && photo.published) {
                if (btnPublish) {
                    btnPublish.style.opacity = '0.5';
                    btnPublish.title = "Đã lên MuseGram";
                    btnPublish.disabled = true;
                }
                const badge = document.createElement('div');
                badge.id = 'zoom-published-badge';
                badge.innerHTML = '✨ Đã Đăng MuseGram';
                badge.style = "position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: var(--primary); padding: 8px 16px; border-radius: 20px; font-weight: bold; border: 1px solid var(--primary); z-index: 101; pointer-events: none;";
                document.getElementById('zoom-modal').appendChild(badge);
            }
        }
        
        document.getElementById('zoom-modal').style.display = 'flex';
    },

    downloadGalleryImage() {
        const url = document.getElementById('zoomed-img').src;
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `CineTech_Gallery_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    async publishToMuseGramFromStudio() {
        if (!this.currentRenderSession || !this.currentRenderSession.url) return;

        const idolId = document.getElementById('studio-idol-select').value;
        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;

        let photoId = this.currentRenderSession.photoId;
        let photoData = null;

        if (this.currentRenderSession.saved && photoId) {
            photoData = await dbManager.getPhoto(photoId);
            if (photoData && photoData.published) {
                return this.showToast("Ảnh này đã được đăng lên MuseGram!", "info");
            }
        }

        let btnPublish = document.getElementById('btn-studio-publish');
        if (btnPublish) btnPublish.style.display = 'none';
        
        let btnGalleryPublish = document.getElementById('btn-gallery-publish');
        if (btnGalleryPublish && document.getElementById('zoom-modal').style.display === 'flex') {
            btnGalleryPublish.disabled = true;
            btnGalleryPublish.style.opacity = '0.5';
        }

        if (!photoData) {
            photoId = await dbManager.savePhoto(idol.id, this.currentRenderSession.url, this.currentRenderSession.prompt, { published: false });
            
            // Cập nhật lại trạng thái saved để không bị đăng trùng
            this.currentRenderSession.saved = true;
            this.currentRenderSession.photoId = photoId;

            photoData = {
                id: photoId,
                idolId: idol.id,
                imageUrl: this.currentRenderSession.url,
                prompt: this.currentRenderSession.prompt,
                timestamp: Date.now(),
                published: false
            };
        }
        
        this.showToast("Đang chuẩn bị tải lên MuseGram...", "info");

        this.executeMuseGramPublish(idol, photoData, null);
    },

    async publishToMuseGram() {
        if (this.zoomedFromStudio && !this.currentGalleryViewId) {
            return this.publishToMuseGramFromStudio();
        }

        if (!this.currentGalleryViewId) return;
        const photo = await dbManager.getPhoto(this.currentGalleryViewId);
        if (!photo) return;
    
        if (photo.published) {
            return this.showToast("Ảnh này đã được đăng lên MuseGram!", "info");
        }
    
        const idol = cardEngine.getIdol(photo.idolId);
        if (!idol) return;
    
        let btnPublish = document.getElementById('btn-gallery-publish');
        if (btnPublish) btnPublish.disabled = true;
    
        this.showToast("Đang tải lên MuseGram...", "info");
        this.executeMuseGramPublish(idol, photo, btnPublish);
    },

    async executeMuseGramPublish(idol, photo, btnElement) {
        this.startTask('musegram_post', 'Đang đăng tải & phân tích tương tác trên MuseGram...');
    
        const visualBonus = (idol.stats.visual > 50) ? (idol.stats.visual - 50) * 0.5 : 0;
        const scandalBonus = (idol.scandalRisk || 0) * 0.5;
        let viralChance = 15 + visualBonus + scandalBonus;
        const isSystemViral = Math.random() * 100 < viralChance;
        const viralStr = isSystemViral ? "BỨC ẢNH NÀY PHẢI TRỞ THÀNH HIỆN TƯỢNG VIRAL! Tạo ra Fame tăng đột biến nhưng Stress cũng tăng cao do áp lực dư luận." : "Bức ảnh này có phản ứng bình thường hoặc flop.";

        const promptText = `Bạn đang giả lập mạng xã hội "MuseGram". Một người mẫu tên "${idol.name}" (Thuộc tính Tha hóa: ${idol.corruption || 0}/100, Mức độ Căng thẳng: ${idol.stress || 0}/100) vừa đăng một ảnh mới. 
Mô tả ảnh vừa đăng (bằng tiếng Anh): "${photo.prompt || "cinematic fashion portrait"}".
ĐỊNH HƯỚNG BẮT BUỘC: ${viralStr}
Cung cấp 3 bình luận (tiếng Việt chân thực, trẻ trung, có thể khen ngợi hoặc soi mói) từ 3 cư dân mạng. Nếu Viral, họ có thể phát cuồng hoặc miệt thị gay gắt.
Cung cấp "fameChange" (Danh tiếng: Viral thì +100 đến +500, Bình thường thì +10 đến +50, Flop thì -10 đến -50).
Cung cấp "stressChange" (Căng thẳng: Viral tăng +15 đến +40 do áp lực, bình thường +0 đến +10).
Output CHỈ TRẢ VỀ JSON:
{
  "comments": [
    { "user": "@username1", "text": "comment text" },
    { "user": "@username2", "text": "comment text" },
    { "user": "@username3", "text": "comment text" }
  ],
  "fameChange": 150,
  "stressChange": 20,
  "isViral": ${isSystemViral}
}
Strictly output JSON only.`;
    
        this.injectKeys();
        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            this.endTask('musegram_post');

            result = result.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const jsonStartIndex = result.indexOf('{');
            const jsonEndIndex = result.lastIndexOf('}');
            if(jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                result = result.substring(jsonStartIndex, jsonEndIndex + 1);
            }

            const data = JSON.parse(result);
    
            photo.published = true;
            await dbManager.updatePhoto(photo);
    
            idol.stats.fame = Math.max(0, idol.stats.fame + (data.fameChange || 0));
            idol.fans = Math.max(0, (idol.fans || 0) + (data.fameChange || 0) * 10);
            idol.stress = Math.min(100, Math.max(0, (idol.stress || 0) + (data.stressChange || 0)));

            await dbManager.saveIdolData(idol);
            if (typeof cardEngine !== 'undefined' && cardEngine.updateTotalFame) cardEngine.updateTotalFame();
            this.refreshUI();
    
            this.showMuseGramResult(idol, photo.imageUrl, data);
    
            if (btnElement) {
                // Because we are likely in the gallery view, let's refresh the badge
                if (this.currentGalleryViewId === photo.id) {
                    this.viewGalleryPhoto(photo.imageUrl, photo.id, photo.idolId);
                }
            }
        } catch (e) {
            this.endTask('musegram_post');
            console.error(e);
            this.showToast("Không thể kết nối đến MuseGram lúc này.", "error");
            if (btnElement) btnElement.disabled = false;
        }
    },
    
    showMuseGramResult(idol, photoUrl, data) {
        const commentsHtml = data.comments.map(c => `
            <div style="margin-bottom: 8px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 13px;">
                <strong style="color: var(--primary);">${c.user}</strong>: <span style="color: var(--text-main);">${c.text}</span>
            </div>
        `).join('');
    
        const fameChangeText = data.fameChange >= 0 ? `<span style="color: #34d399;">+${data.fameChange} Fame</span>` : `<span style="color: #ef4444;">${data.fameChange} Fame</span>`;
        const stressChangeText = data.stressChange > 0 ? `<span style="color: #ef4444;">+${data.stressChange} Stress</span>` : `<span style="color: #34d399;">${data.stressChange} Stress</span>`;
        let viralBadge = data.isViral ? `<div style="display:inline-block; background:#ef4444; color:white; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:12px; margin-bottom:10px; animation: pulse 1.5s infinite;">🔥 VIRAL SENSATION 🔥</div>` : ``;
        
        let diamondText = "";
        if (data.isViral && Math.random() < 0.4) {
            let diamondReward = Math.floor(Math.random() * 2) + 1;
            gameManager.updateDiamonds(diamondReward);
            diamondText = `<div style="margin-top:5px; color:#60a5fa; font-weight:bold; font-size:12px; text-align:center;">Fan cứng donate: +${diamondReward} 💎</div>`;
        }
    
        this.showDialog({
            title: `📱 MuseGram: ${idol.name}`,
            message: `
                <div style="text-align: center; margin-bottom: 20px;">
                    ${viralBadge}
                    ${diamondText}
                    <img src="${photoUrl}" style="max-height: 200px; margin-top: 10px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); width: 100%; object-fit: cover;">
                </div>
                <div style="margin-bottom: 15px; display:flex; justify-content: space-around; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px;">
                    <div><strong>Danh tiếng:</strong> ${fameChangeText}</div>
                    <div><strong>Áp lực:</strong> ${stressChangeText}</div>
                </div>
                <div>
                    <strong style="color:var(--text-muted); font-size: 12px; text-transform: uppercase;">Bình luận nổi bật:</strong>
                    <div style="margin-top: 8px; max-height: 150px; overflow-y: auto;">
                        ${commentsHtml}
                    </div>
                </div>
            `,
            type: "info"
        });
    },

    async deleteGalleryImage() {
        if (!this.currentGalleryViewId) return;
        
        this.showDialog({
            title: `<span style="color:var(--error);">⚠️ XÓA KHUNG HÌNH</span>`,
            message: "Bạn có chắc chắn muốn xóa ảnh này khỏi kho lưu trữ? Thao tác không thể hoàn tác.",
            type: "confirm",
            onConfirm: async () => {
                const success = await dbManager.deletePhoto(this.currentGalleryViewId);
                if (success) {
                    this.showToast("Đã xóa ảnh!", "success");
                    document.getElementById('zoom-modal').style.display = 'none';
                    this.openGallery(); // reload gallery
                } else {
                    this.showToast("Xóa ảnh thất bại.", "error");
                }
            }
        });
    },

    async setGalleryImageAsAvatar() {
        if (!this.currentGalleryViewId || !this.currentGalleryIdolId) return;
        
        const success = await cardEngine.updateAvatar(this.currentGalleryIdolId, document.getElementById('zoomed-img').src);
        if (success) {
            this.refreshUI();
            this.showToast("Đã đặt làm Avatar thành công!", "success");
        }
    },

    executeFashionWeekBattle(idolId, rivalData) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        
        const rivalScore = Math.floor(Math.random() * 50) + 50 + (gameManager.state.actionCount * 2); 
        const myScore = idol.stats.visual + Math.floor(Math.random() * 20) + (idol.fans ? Math.floor(idol.fans / 100) : 0);
        
        if (myScore >= rivalScore) {
            let diamondText = "";
            if (myScore - rivalScore >= 10 && Math.random() <= 0.4) {
                let diamondReward = Math.floor(Math.random() * 2) + 2;
                gameManager.updateDiamonds(diamondReward);
                diamondText = `<br><span style="color:#60a5fa; margin-top:5px; display:inline-block; font-weight:bold;">Biểu diễn áp đảo: Nhận thêm ${diamondReward} 💎</span>`;
            }

            const reward = 5000 + Math.floor(Math.random() * 5000);
            gameManager.updateMoney(reward);
            idol.fans = (idol.fans || 0) + 500;
            idol.exp = (idol.exp || 0) + 1000;
            dbManager.saveIdolData(idol);
            this.refreshUI();
            
            this.showDialog({
                title: `✨ CHIẾN THẮNG FASHION WEEK!`,
                message: `<strong>${idol.name}</strong> (Điểm trình diễn: ${myScore}) đã đánh bại <strong>${rivalData.name}</strong> (Điểm trình diễn: ${rivalScore}) trên sàn Runway!<br><br>
                <strong style="color:var(--gold);">Nhận được Hợp Đồng Độc Quyền: ${reward.toLocaleString()} 💰</strong><br>
                <span style="color:#34d399;">+500 Fans | +1000 EXP</span>${diamondText}`,
                type: "info"
            });
        } else {
            idol.stress = Math.min(100, (idol.stress || 0) + 30);
            dbManager.saveIdolData(idol);
            this.refreshUI();
            
            this.showDialog({
                title: `💥 THẤT BẠI...`,
                message: `<strong>${rivalData.name}</strong> (Điểm trình diễn: ${rivalScore}) đã chiếm trọn Spotlight, lấn át <strong>${idol.name}</strong> (Điểm trình diễn: ${myScore}).<br><br>
                <div style="color:var(--error);">Bạn đánh mất hợp đồng độc quyền. Model bị Căng thẳng +30.</div>`,
                type: "info"
            });
        }
    },

    async triggerRandomEvent() {
        if (this.hasAnyTaskRunning() || document.getElementById('dialog-modal').style.display === 'flex') {
            this.pendingRandomEvent = true;
            return;
        }

        const idols = cardEngine.getAllIdols();
        if (idols.length === 0) return;

        // Tìm model có yếu tố dễ dính scandal nhất (stress cao, tha hóa cao, fame cao)
        let targetIdol = idols[Math.floor(Math.random() * idols.length)];
        let highRiskIdols = idols.filter(i => (i.stress > 70 || i.corruption > 60 || i.stats.scandal_risk > 50));
        if (highRiskIdols.length > 0 && Math.random() > 0.3) {
            targetIdol = highRiskIdols[Math.floor(Math.random() * highRiskIdols.length)];
        }

        const eventType = (Math.random() > 0.6 && highRiskIdols.length === 0) ? 'FASHION_WEEK' : 'PAPARAZZI';
        
        if (eventType === 'FASHION_WEEK' && this.triggerFashionWeek) {
            return this.triggerFashionWeek();
        }

        this.showToast(`📸 FLASHLIGHT FLASH! Paparazzi đã bắt được hình ảnh của ${targetIdol.name}!`, "error");
        
        this.startTask('paparazzi', 'Đang thu thập thông tin tình báo...');
        
        const promptText = `Bạn là AI Giám đốc Truyền thông (Crisis Management). Ngôi sao ${targetIdol.name} (Danh tiếng: ${targetIdol.stats.fame}, Áp lực: ${targetIdol.stress||0}/100, Tha hóa: ${targetIdol.corruption||0}/100, Rủi ro: ${targetIdol.stats.scandal_risk}) vừa bị Paparazzi bắt gặp hoặc tạo ra một khủng hoảng truyền thông.
        Nếu Tha hóa/Rủi ro cao, đây có thể là scandal tình ái, lộ ảnh nóng, thái độ trịch thượng.
        Nếu Áp lực cao, có thể là kiệt sức ngất xỉu, khóc lóc giữa đường.
        Tạo báo cáo Khủng hoảng.
        Output ONLY JSON (DO NOT add // comments inside the JSON):
        {
          "title": "Tiêu đề trang nhất báo lá cải",
          "content": "Chi tiết hình ảnh Paparazzi chụp được và dư luận (Tiếng Việt)",
          "options": [
            { "text": "Chi tiền Bịt miệng nhà báo", "cost": 5000, "fameEffect": 0, "stressEffect": -10, "corruptionEffect": 15 },
            { "text": "Công khai xin lỗi, cúi đầu trần tình", "cost": 500, "fameEffect": -50, "stressEffect": 30, "corruptionEffect": -10 },
            { "text": "Thuê Đội PR Tẩy trắng (Spin Doctor)", "cost": 15000, "fameEffect": 100, "stressEffect": 5, "corruptionEffect": 5 },
            { "text": "Phủ nhận mọi thứ, dọa kiện", "cost": 1000, "fameEffect": -80, "stressEffect": 40, "corruptionEffect": 0 }
          ]
        }`;

        try {
            this.injectKeys();
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            this.endTask('paparazzi');
            
            let jsonStr = result;
            const match = result.match(/\{[\s\S]*\}/);
            if (match) jsonStr = match[0];
            else jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            let buttonsHtml = '';
            data.options.forEach((opt, index) => {
                const optCostLabel = opt.cost > 0 ? ` 💸 -${opt.cost.toLocaleString()}` : '';
                buttonsHtml += `<button class="btn-action w-full mb-2" style="background:var(--bg-elevated); border:1px solid var(--border-color);" onclick="gameApp.resolveScandal('${targetIdol.id}', ${index}, ${opt.cost}, ${opt.fameEffect}, ${opt.stressEffect}, ${opt.corruptionEffect || 0}, this)">${opt.text}${optCostLabel}</button>`;
            });

            this.showDialog({
                title: `📸 <strong>TÒA SOẠN DISPATCH: PAPARAZZI LEAK!</strong>`,
                message: `<div style="padding: 15px; background: rgba(239, 68, 68, 0.15); border-left: 4px solid var(--error); border-radius: 4px; margin-bottom: 20px;">
                    <strong style="color:var(--error); font-size:16px;">🔥 ${data.title}</strong><br><br>
                    <span style="color:var(--text-main); font-size:14px; line-height: 1.5;">${data.content}</span>
                </div>
                <div style="font-weight:bold; color:var(--gold); margin-bottom:10px;">BAN QUẢN LÝ, HÃY ĐƯA RA QUYẾT ĐỊNH XỬ LÝ KHỦNG HOẢNG:</div>
                <div style="display:flex; flex-direction:column; gap:8px;">${buttonsHtml}</div>`,
                type: "alert"
            });
            
        } catch(e) {
            console.error(e);
            this.showToast("Radar Paparazzi bị nhiễu sóng...", "error");
        }
    },

    async resolveScandal(idolId, optionIndex, cost, fameEffect, stressEffect, corruptionEffect, btnEl) {
        if (gameManager.state.money < cost) {
            this.showToast("Công ty không đủ Ngân sách để thực hiện chiến dịch Media này!", "error");
            return;
        }

        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;

        btnEl.innerHTML = "⏳ Đang dàn xếp truyền thông...";
        btnEl.disabled = true;

        gameManager.updateMoney(-cost);
        idol.stats.fame = Math.max(0, idol.stats.fame + fameEffect);
        idol.fans = Math.max(0, (idol.fans||0) + (fameEffect * 10)); // fame cũng ảnh hưởng fan
        idol.stress = Math.min(100, Math.max(0, (idol.stress || 0) + stressEffect));
        idol.corruption = Math.min(100, Math.max(0, (idol.corruption || 0) + corruptionEffect));
        await dbManager.saveIdolData(idol);
        this.refreshUI();

        // Close current dialog
        const modal = document.getElementById('dialog-modal');
        if (modal) modal.style.display = 'none';

        setTimeout(() => {
            let effectDesc = fameEffect >= 0 ? `<span style="color:var(--success)">Danh tiếng: +${fameEffect}</span>` : `<span style="color:var(--error)">Danh tiếng: ${fameEffect}</span>`;
            let stressDesc = stressEffect > 0 ? `<span style="color:var(--error)">Áp lực: +${stressEffect}</span>` : `<span style="color:var(--success)">Áp lực: ${stressEffect}</span>`;
            let corrDesc = corruptionEffect > 0 ? `<span style="color:#a855f7">Tha hóa: +${corruptionEffect}</span>` : `<span style="color:var(--success)">Tha hóa: ${corruptionEffect}</span>`;
            
            this.showDialog({
                title: "✅ BÁO CÁO SAU KHỦNG HOẢNG",
                message: `<div style="text-align:center;">
                    <p style="color:var(--text-muted); margin-bottom:15px;">Dư luận đã phản ứng sau chiến dịch xử lý khủng hoảng của ngài.</p>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; font-weight:bold; display:inline-block; text-align:left;">
                        ${effectDesc}<br>
                        ${stressDesc}<br>
                        ${corrDesc}
                    </div>
                </div>`,
                type: "info"
            });
        }, 800);
    },

    async triggerFashionWeek() {
        if (this.hasAnyTaskRunning() || document.getElementById('dialog-modal').style.display === 'flex') {
            this.pendingFashionWeek = true;
            return;
        }

        this.showToast("Đang chuẩn bị sự kiện Fashion Week...", "info");
        this.injectKeys();
        this.startTask('fashion_week_rival', 'Đang thiết lập đối thủ cạnh tranh...');
        
        const promptText = `Hãy đóng vai một chuyên gia sắc đẹp và tổ chức sự kiện đỉnh cao tại Fashion Week. Tạo ra một "Rival Model" (người mẫu đối thủ cực mạnh) đến từ công ty cạnh tranh nhan sắc.
Yêu cầu:
- name: Tên lộng lẫy, sang chảnh (Tiếng Anh/Pháp...).
- concept: Phong cách thời trang đặc trưng (Tiếng Anh).
- agency: Tên công ty đối thủ (Tiếng Anh).
- threatMessage: Lời thách thức hoặc lời đồn đại sắc bén về đối thủ bằng Tiếng Việt (mang tính chất dằn mặt, drama thời trang).
Output ONLY JSON (DO NOT add // comments inside the JSON):
{
  "name": "Stella Cruz",
  "concept": "Avant-garde / High Fashion",
  "agency": "Eclipse Models",
  "threatMessage": "Cô ta được mệnh danh là 'Nữ hoàng băng giá', sẵn sàng đè bẹp bất cứ ai dám cản đường trên sàn catwalk."
}
No Markdown.`;
        
        let rivalData = {
            name: "Lumina", concept: "Luxury Beauty", agency: "Global Starz", threatMessage: "Cô ta muốn nghiền nát bạn trên sàn diễn."
        };
        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            let result = (provider === 'gemini') ? await service.generateContent(promptText) : await service.generateText(promptText);
            
            result = result.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const jsonStartIndex = result.indexOf('{');
            const jsonEndIndex = result.lastIndexOf('}');
            if(jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                result = result.substring(jsonStartIndex, jsonEndIndex + 1);
            }
            rivalData = JSON.parse(result);
        } catch (e) {
            console.error(e);
        } finally {
            this.endTask('fashion_week_rival');
        }
        
        const idols = cardEngine.getAllIdols();
        if (idols.length === 0) {
            return;
        }

        let selectOptions = idols.map(i => {
           return `<option value="${i.id}">${i.name} - Visual: ${i.stats.visual} | Fans: ${i.fans || 0}</option>`;
        }).join('');
        
        this.showDialog({
            title: `🏆 FASHION WEEK ĐÃ BẮT ĐẦU!`,
            message: `<div style="text-align:center; margin-bottom: 15px;">
                <span style="font-size: 40px;">👑</span>
                <h3 style="color:var(--gold); margin: 5px 0;">ĐỐI THỦ XUẤT HIỆN</h3>
                <p><strong>${rivalData.name}</strong> <em>(${rivalData.concept})</em> từ <strong>${rivalData.agency}</strong>.</p>
                <p style="color:var(--error); font-size:13px;">"${rivalData.threatMessage}"</p>
            </div>
            Chọn Model tốt nhất của bạn để đấu Visual trên sàn Runway (Nhận hợp đồng độc quyền nếu thắng):<br><br>
            <select id="fashion-week-select" class="w-full p-2" style="background:var(--bg-elevated); color:white; border:1px solid var(--border-color); border-radius:4px;">${selectOptions}</select>`,
            type: "confirm",
            onConfirm: () => {
                const idolId = document.getElementById('fashion-week-select').value;
                this.executeFashionWeekBattle(idolId, rivalData);
            }
        });
    },

    openMuseGram(idolId) {
        const idol = cardEngine.getIdol(idolId);
        if (!idol) return;
        const totalFollowers = ((idol.stats.fame + idol.stats.visual) * 123 + (idol.fans || 500)).toLocaleString();
        
        this.showDialog({
            title: `📱 MUSEGRAM KHÔNG GIAN ẢO`,
            message: `<div style="text-align:center;">
                <img src="${idol.avatarUrl && !idol.avatarUrl.startsWith('blob') ? idol.avatarUrl : this.fallbackImage}" style="width:80px; height:80px; border-radius:50%; border:3px solid var(--primary); object-fit:cover; margin-bottom: 10px;">
                <h3 style="margin:0; color:var(--text-main);">${idol.name} <span style="color:#38bdf8;">☑</span></h3>
                <p style="font-size:12px; color:var(--text-muted); font-style:italic; margin-top:4px;">"${idol.concept}"</p>
                
                <div style="display:flex; justify-content:center; gap:20px; margin: 15px 0; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px;">
                     <div><div style="font-weight:bold; color:var(--text-main);">${idol.stats.fame}</div><div style="font-size:10px; color:var(--text-muted);">BÀI MỚI</div></div>
                     <div><div style="font-weight:bold; color:var(--text-main);">${totalFollowers}</div><div style="font-size:10px; color:var(--text-muted);">FOLLOWERS</div></div>
                     <div><div style="font-weight:bold; color:var(--gold);">99%</div><div style="font-size:10px; color:var(--text-muted);">ENGAGEMENT</div></div>
                </div>
                
                <button class="btn-action w-full" style="background:var(--primary); color:white; border:none;" onclick="gameApp.buyFakeFollowers('${idolId}')">📈 BƠM 10,000 FOLLOWER ẢO (500 💰)</button>
            </div>`,
            type: "info"
        });
    },

    buyFakeFollowers(idolId) {
        if(gameManager.state.money < 500) return this.showToast("Cần 500 💰", "error");
        gameManager.updateMoney(-500);
        const idol = cardEngine.getIdol(idolId);
        idol.fans = (idol.fans || 0) + 10000;
        idol.scandalRisk = Math.min(100, (idol.scandalRisk || 0) + 5);
        idol.stats.scandal_risk = idol.scandalRisk;
        dbManager.saveIdolData(idol);
        this.showToast("Đã bơm 10,000 Fan ảo thành công. Rủi ro scandal tăng!", "success");
        document.getElementById('dialog-modal').style.display = 'none'; // Close
        setTimeout(() => this.openMuseGram(idolId), 100);
    },

    async openDating(idolId) {
        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;
        if(gameManager.state.money < 2000) return this.showToast("Cần 2000 💰 để chuẩn bị buổi hẹn VIP!", "error");
        
        gameManager.updateMoney(-2000);
        this.showToast("Đang thiết lập buồi tối lãng mạn tại Landmark Peak...", "info");
        
        const dialogue = await this.generateCondoDialogue(idol, "gift"); 
        
        idol.stress = 0;
        idol.affinity = 100;
        if (!idol.traits) idol.traits = [];
        if (!idol.traits.includes("Người tình (Lover)")) {
            idol.traits.push("Người tình (Lover)");
        }
        await dbManager.saveIdolData(idol);
        
        this.showDialog({
            title: `🥂 HẸN HÒ: ĐÊM LÃNG MẠN`,
            message: `<div style="text-align:left;">
            <p style="color:var(--gold); font-size:13px; font-style:italic;">Dưới ánh nến lung linh, giữa tiếng nhạc Jazz du dương, ${idol.name} nhìn bạn với ánh mắt trìu mến...</p>
            <p style="color:var(--text-main); border-left:3px solid #ec4899; padding-left:10px; margin-top:10px;">"${dialogue}"</p>
            <p style="color:#10b981; font-weight:bold; font-size:12px; margin-top:15px;">💕 Cảm xúc đạt cực hạn! Cô ấy tự hào là LOVER của bạn! Trạng thái tâm lý đã hoàn toàn ổn định.</p>
            </div>`,
            type: "info"
        });
        
        this.refreshUI();
    },
    
    showArchetypeChoice(idolId) {
        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;
        this.showDialog({
            title: `🌟 CHỌN HƯỚNG PHÁT TRIỂN (LV.5+)`,
            message: `Model ${idol.name} đã trưởng thành. Bạn định hướng cô ấy theo con đường nào?<br><br>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn-action" style="background:#8b5cf6;" onclick="gameApp.setArchetype('${idolId}', 'High Fashion Model', 20, 0)">👗 High Fashion Model (+20 Visual, Thuần thời trang)</button>
                    <button class="btn-action" style="background:#ec4899;" onclick="gameApp.setArchetype('${idolId}', 'Commercial Queen', 0, 30)">📺 Commercial Star (+30 Fame, Quảng cáo truyền hình)</button>
                    <button class="btn-action" style="background:#10b981;" onclick="gameApp.setArchetype('${idolId}', 'Fitness Icon', 10, 10)">💪 Thần Tượng Thể Thao (+Sức khỏe tinh thần)</button>
                </div>`,
            type: "info"
        });
    },
    
    setArchetype(idolId, arch, visualBonus, fameBonus) {
        const idol = cardEngine.getIdol(idolId);
        idol.archetype = arch;
        idol.concept += ` | Spec: ${arch}`;
        idol.stats.visual = Math.min(100, idol.stats.visual + visualBonus);
        idol.stats.fame += fameBonus;
        dbManager.saveIdolData(idol);
        this.showToast(`Đã thăng cấp chức danh chuyên nghiệp!`, "success");
        document.getElementById('dialog-modal').style.display = 'none';
        this.openIdolProfile(idolId);
        this.refreshUI();
    },

    triggerScandalCrisis(idolId) {
        if (this.hasAnyTaskRunning() || document.getElementById('dialog-modal').style.display === 'flex') {
            this.pendingScandalCrisis = idolId;
            return;
        }

        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;
        
        if (Math.random() < 0.5) return; // Chỉ 50% ra event
        const costToBribe = idol.stats.fame * 10;
        
        if (idol.scandalRisk < 50) return;
        
        this.showDialog({
            title: `🚨 KHỦNG HOẢNG TRUYỀN THÔNG!`,
            message: `<div style="text-align:left;">
            <p style="color:#ef4444; font-weight:bold;">Đường dây truyền thông báo động đỏ!</p>
            <p style="font-size:13px; color:var(--text-main);">Paparazzi đã tung những hình ảnh và thông tin từ 'Thế giới ngầm' của ${idol.name}. Chỉ số Phốt đang lên mức ${idol.scandalRisk}%.</p>
            <p style="font-size:12px; color:var(--text-muted); margin-top:10px;">Bạn phải xử lý dứt điểm trước khi mạng xã hội tẩy chay cô ấy!</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:15px;">
                <button class="btn-action" style="background:#ef4444; color:#fff;" onclick="gameApp.resolveScandalCrisis('${idolId}', 'pay')">💸 CHI TIỀN BỊT MIỆNG ĐỐI TÁC (${costToBribe} 💰)</button>
                <button class="btn-action" style="background:#f59e0b; color:#fff;" onclick="gameApp.resolveScandalCrisis('${idolId}', 'apology')">😢 BẮT MODEL ĐĂNG ĐÀN XIN LỖI (+30 Stress, -20 Hảo cảm)</button>
                <button class="btn-action" style="background:var(--bg-elevated); color:var(--text-muted);" onclick="gameApp.resolveScandalCrisis('${idolId}', 'ignore')">🛑 MẶC KỆ DƯ LUẬN (Random Hậu Quả)</button>
            </div>`,
            type: "info"
        });
    },
    
    resolveScandalCrisis(idolId, action) {
        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;
        const costToBribe = idol.stats.fame * 10;
        
        document.getElementById('dialog-modal').style.display = 'none';
        
        let reportMsg = "";
        
        if (action === 'pay') {
            if (gameManager.state.money < costToBribe) return this.showToast("Bạn không đủ tiền để ém nhẹm tin đồn!", "error");
            gameManager.updateMoney(-costToBribe);
            idol.scandalRisk = Math.max(0, idol.scandalRisk - 30);
            reportMsg = `<span style="color:var(--success)">Nguy cơ Phong sát: -30</span><br><span style="color:var(--error)">Ngân sách: -${costToBribe} 💰</span>`;
            this.showToast(`Bưng bít tin đồn thành công. Nhóm Báo lá cải đã lấy ${costToBribe}💰`, "success");
        } else if (action === 'apology') {
            idol.stress = Math.min(100, (idol.stress || 0) + 30);
            idol.affinity = Math.max(0, (idol.affinity || 0) - 20);
            idol.scandalRisk = Math.max(0, idol.scandalRisk - 15);
            reportMsg = `<span style="color:var(--success)">Nguy cơ Phong sát: -15</span><br><span style="color:var(--error)">Áp lực (Stress): +30</span><br><span style="color:var(--error)">Hảo cảm: -20</span>`;
            this.showToast("Bức tâm thư lấy đi nước mắt dư luận. Rủi ro phong sát giảm, nhưng tâm lý Model tồi tệ đi.", "info");
        } else if (action === 'ignore') {
            if (Math.random() < 0.4) {
                idol.scandalRisk = Math.min(100, idol.scandalRisk + 25);
                reportMsg = `<span style="color:var(--error)">Dư luận phẫn nộ! Nguy cơ Phong sát: +25</span>`;
                this.showToast("Dư luận giận dữ! Mọi thứ trở nên tồi tệ hơn!", "error");
                if (idol.scandalRisk >= 100) this.showToast("BỊ PHONG SÁT ĐÓNG BĂNG KIẾM TIỀN CHỜ CHẾT!", "error");
            } else {
                idol.scandalRisk = Math.max(0, idol.scandalRisk - 5);
                idol.stats.fame += 5; // Hắc hồng
                reportMsg = `<span style="color:var(--success)">Danh tiếng: +5 (Hắc hồng)</span><br><span style="color:var(--success)">Nguy cơ Phong sát: -5</span>`;
                this.showToast("Scandal tự nhiên lắng xuống, mọi thứ lại bình thường. Thậm chí cô ta còn nổi tiếng lên!", "success");
            }
        }
        idol.stats.scandal_risk = idol.scandalRisk;
        dbManager.saveIdolData(idol);
        this.refreshUI();
        
        setTimeout(() => {
            this.showDialog({
                title: "✅ BÁO CÁO SAU KHỦNG HOẢNG",
                message: `<div style="text-align:center;">
                    <p style="color:var(--text-muted); margin-bottom:15px;">Kết quả từ quyết định xử lý khủng hoảng của bạn:</p>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; font-weight:bold; display:inline-block; text-align:left;">
                        ${reportMsg}
                    </div>
                </div>`,
                type: "info"
            });
        }, 800);
    },

    triggerHeadhunting(idolId) {
        if (this.hasAnyTaskRunning() || document.getElementById('dialog-modal').style.display === 'flex') {
            this.pendingHeadhunting = idolId;
            return;
        }

        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;

        // Cơ chế giữ chân siêu sao
        this.showDialog({
            title: `🤝 CƯỚP SIÊU SAO (HEADHUNTING)!`,
            message: `<div style="text-align:left;">
            <p style="color:#ef4444; font-weight:bold;">Một Agency đối thủ đang tiếp cận ${idol.name}!</p>
            <p style="font-size:13px; color:var(--text-main);">Họ hứa hẹn mức lương cao hơn và điều kiện làm việc tốt hơn. Do Căng thẳng của cô ấy đang cao hoặc Hảo cảm với bạn thấp, cô ấy đang dao động.</p>
            <p style="font-size:12px; color:var(--text-muted); margin-top:10px;">Bạn cần đãi ngộ tốt hơn để giữ cô ấy lại, nếu không cô ấy sẽ rời công ty!</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:15px;">
                <button class="btn-action" style="background:var(--primary); color:#000;" onclick="gameApp.resolveHeadhunting('${idolId}', 'spa')">🏖️ THIẾT ĐÃI KỲ NGHỈ SPA (1500 💰)</button>
                <button class="btn-action" style="background:#f59e0b; color:#fff;" onclick="gameApp.resolveHeadhunting('${idolId}', 'talk')">💬 THUYẾT PHỤC BẰNG TÌNH CẢM (-50 Stress, +10 Hảo cảm)</button>
                <button class="btn-action" style="background:var(--bg-elevated); color:var(--text-muted);" onclick="gameApp.resolveHeadhunting('${idolId}', 'let_go')">🚪 ĐỂ CÔ ẤY RA ĐI</button>
            </div>`,
            type: "info"
        });
    },

    async resolveHeadhunting(idolId, action) {
        const idol = cardEngine.getIdol(idolId);
        if(!idol) return;
        
        document.getElementById('dialog-modal').style.display = 'none';

        if (action === 'spa') {
            if (gameManager.state.money < 1500) {
                this.showToast("Bạn không đủ tiền! Cô ấy đã bỏ đi...", "error");
                await cardEngine.deleteIdol(idolId);
            } else {
                gameManager.updateMoney(-1500);
                idol.stress = 0;
                idol.affinity = Math.min(100, (idol.affinity || 0) + 30);
                this.showToast(`Bạn vung tiền mua cho ${idol.name} một chuyến du lịch hạng sang. Cô ấy quyết định ở lại!`, "success");
            }
        } else if (action === 'talk') {
            if ((idol.affinity || 30) < 50) {
                this.showToast(`Hảo cảm quá thấp! ${idol.name} không tin những lời hứa suông và đã rời đi!`, "error");
                await cardEngine.deleteIdol(idolId);
            } else {
                idol.stress = Math.max(0, (idol.stress || 0) - 50);
                idol.affinity = Math.min(100, (idol.affinity || 0) + 10);
                this.showToast(`${idol.name} cảm động trước sự chân thành của bạn và xé bản hợp đồng của đối thủ.`, "success");
            }
        } else if (action === 'let_go') {
            this.showToast(`Bạn lạnh lùng để ${idol.name} rời đi sang Agency khác.`, "info");
            await cardEngine.poachIdol(idolId);
        }

        if (cardEngine.getIdol(idolId)) {
            dbManager.saveIdolData(idol);
        }
        
        this.refreshUI();
        if (typeof this.renderCards === 'function') this.renderCards();
    }
};

window.onload = () => gameApp.init();
