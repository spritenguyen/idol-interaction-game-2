class GameManager {
    constructor() {
        this.state = {
            money: 5000,
            diamonds: 50,
            day: 1,
            actionCount: 0,
            achievements: [],
            inventory: {} // key: itemId, value: quantity
        };
        this.shopItems = [
            { id: 'item_drink', name: '🥤 Matcha Latte', desc: 'Giảm 20 Căng thẳng (Stress)', price: 150, type: 'stress', effect: -20 },
            { id: 'item_energy', name: '⚡ Nước Tăng Lực VIP', desc: 'Giảm cực nhanh 50 Căng thẳng nhưng tăng 5 Tha hóa do ép bản thân', price: 250, type: 'stress_heavy', effect: -50 },
            { id: 'item_meal', name: '🥗 Salad Cá hồi', desc: 'Giảm cân (-1kg), Giảm 10 Căng thẳng', price: 200, type: 'weight_down', effect: -1 },
            { id: 'item_diet_pill', name: '💊 Thuốc Giảm Cân', desc: 'Giảm nhanh 3kg nhưng Tăng 30 Stress & 10 Tha hóa', price: 400, type: 'weight_fast', effect: -3 },
            { id: 'item_perfume', name: '✨ Chanel No.5', desc: 'Tăng 30 Hảo cảm (Affinity)', price: 500, type: 'affinity', effect: 30 },
            { id: 'item_dress', name: '👗 Váy Gucci Couture', desc: 'Tăng 10 Visual, Phục hồi Tâm trạng', price: 1500, type: 'visual', effect: 10 },
            { id: 'item_luxury_bag', name: '👜 Túi xách Hermes', desc: 'Quà tặng xa xỉ: Tăng 50 Hảo cảm, Tăng 15 Visual', price: 5000, type: 'gift_luxury', effect: 50 },
            { id: 'item_course', name: '📚 Khóa diễn xuất', desc: 'Tăng 50 EXP ngay lập tức', price: 800, type: 'exp', effect: 50 },
            { id: 'item_masterclass', name: '🎓 Masterclass VIP', desc: 'Tăng 200 EXP, Tăng 5 Danh tiếng (Fame)', price: 2500, type: 'exp_high', effect: 200 },
            // Diamond Items
            { id: 'item_diamond_ring', name: '💍 Nhẫn Kim Cương', desc: 'Sức mạnh tuyệt đối: Tăng 100 Hảo Cảm & 30 Visual', price: 20, currency: 'diamond', type: 'gift_diamond', effect: 100 },
            { id: 'item_media_ticket', name: '🎟️ Thẻ Truyền Thông VIP', desc: 'Tăng ngay 50 Danh tiếng (Fame) & Tẩy trắng scandal', price: 50, currency: 'diamond', type: 'media_vip', effect: 50 },
            { id: 'item_money_bag', name: '💰 Quỹ Hỗ Trợ Khẩn', desc: 'Quy đổi: Nhận ngay 10,000 Tiền mặt ngân sách', price: 30, currency: 'diamond', type: 'exchange_money', effect: 10000 },
            
            // Outfits
            { id: 'outfit_swimsuit', name: '👙 Bikini Ánh Kim', desc: 'Trang phục quyến rũ. Bổ sung vào Kho đồ Model.', price: 1500, type: 'outfit', effect: 'Metallic Bikini Swimsuit' },
            { id: 'outfit_goth', name: '👗 Váy Goth Lolita', desc: 'Trang phục ma mị. Bổ sung vào Kho đồ Model.', price: 2000, type: 'outfit', effect: 'Gothic Lolita Dress, dark elegant' },
            { id: 'outfit_cyber', name: '🕶️ Áo Khoác Cyberpunk', desc: 'Trang phục viễn tưởng. Bổ sung vào Kho đồ Model.', price: 2500, type: 'outfit', effect: 'Cyberpunk neon jacket, futuristic style' },
            { id: 'outfit_elegant', name: '🥻 Dạ hội Thượng Lưu', desc: 'Trang phục sang trọng. Bổ sung vào Kho đồ Model.', price: 3000, type: 'outfit', effect: 'Elegant high-fashion evening gown' },
            { id: 'outfit_bunny', name: '🐰 Đồ Thỏ Ngọc', desc: 'Hơi hư hỏng. Bổ sung vào Kho đồ Model.', price: 30, currency: 'diamond', type: 'outfit', effect: 'Playboy bunny suit outfit, cute and sexy' }
        ];
        this.blackMarketItems = [
            { id: 'bm_steroid', name: '💉 Tiêm Hóa Chất (Siêu Tốc)', desc: 'Tăng ngay 30 Visual, nhưng tăng 15% Scandal Risk & 20 Tha hóa', price: 3000, type: 'bm_visual', effect: 30 },
            { id: 'bm_brainwash', name: '🧠 Khóa Đào Tạo Tâm Lý Đen', desc: 'Giảm 100 Stress, nhưng Model mất 30 Hảo cảm và Mất nhân tính (+30 Tha hóa, +10% Scandal)', price: 2000, type: 'bm_brainwash', effect: -100 },
            { id: 'bm_fake_news', name: '📰 Mua Truyền Thông Bẩn', desc: 'Tăng ảo 20 Fame, nhưng tạo ra 25% Scandal Risk tiềm ẩn.', price: 5000, type: 'bm_fame', effect: 20 },
            { id: 'bm_wipe_scandal', name: '🕵️ Mua Chuộc Giới Báo Chí', desc: 'Giảm 30% Scandal Risk hiện tại. Rất đắt đồ.', price: 10000, type: 'bm_wipe', effect: -30 }
        ];
        this.currentJobs = [];
        this.achievementsList = [
            { id: 'FIRST_SCOUT', title: 'Tân Binh Lộ Diện', desc: 'Thực hiện lần tìm kiếm model đầu tiên.', reward: 10, icon: '🎯' },
            { id: 'FIRST_SHOOT', title: 'Ánh Đèn Sân Khấu', desc: 'Hoàn thành buổi chụp ảnh đầu tiên.', reward: 15, icon: '📸' },
            { id: 'FAME_50', title: 'Ngôi Sao Đang Lên', desc: 'Sở hữu Idol đạt 50+ Fame.', reward: 20, icon: '⭐' },
            { id: 'ROSTER_3', title: 'Công Ty Phát Triển', desc: 'Sở hữu 3 Idol trong đội hình.', reward: 30, icon: '🏢' },
            { id: 'PHOTOGRAPHER', title: 'Nhiếp Ảnh Gia Đỉnh Cao', desc: 'Lưu 5 bức ảnh vào Gallery.', reward: 40, icon: '🖼️' },
            { id: 'VIP_CASTING', title: 'Truyền Thượng Lưu', desc: 'Tuyển mộ 1 Model từ VIP Casting.', reward: 50, icon: '👑' },
            { id: 'LEVEL_10', title: 'Siêu Sao Nở Rộ', desc: 'Model đạt Level 10.', reward: 100, icon: '🌟' }
        ];
    }
    
    init() {
        const saved = localStorage.getItem('muse_gamestate_v2');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
            if(!this.state.inventory) this.state.inventory = {};
        }
        this.generateJobs();
        this.updateUI();
    }
    
    generateJobs() {
        if(this.currentJobs && this.currentJobs.length > 0) return;
        const jobTypes = [
            { icon: '📸', name: 'Lookbook Thời trang hè', reqFame: 10, reward: 500, stress: 15, exp: 20 },
            { icon: '🎬', name: 'Đóng MV Ca nhạc', reqFame: 30, reward: 1200, stress: 30, exp: 50 },
            { icon: '📺', name: 'Quảng cáo Sữa dưỡng thể', reqFame: 50, reward: 2500, stress: 20, exp: 80 },
            { icon: '👠', name: 'Catwalk tuần lễ thời trang', reqFame: 80, reward: 5000, stress: 50, exp: 150 },
            { icon: '✨', name: 'Đại sứ thương hiệu Mỹ phẩm', reqFame: 150, reward: 12000, stress: 80, exp: 300 }
        ];
        
        this.currentJobs = [];
        for(let i=0; i<3; i++) {
            const j = jobTypes[Math.floor(Math.random() * jobTypes.length)];
            this.currentJobs.push({ ...j, id: 'job_' + Date.now() + i });
        }
    }
    
    refreshJobs() {
        if(this.state.money >= 50) {
            this.updateMoney(-50);
            this.currentJobs = [];
            this.generateJobs();
            return true;
        }
        return false;
    }
    
    buyItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if(!item) return false;

        const isDiamond = item.currency === 'diamond';
        if (isDiamond) {
            if (this.state.diamonds >= item.price) {
                this.updateDiamonds(-item.price);
                if(!this.state.inventory[itemId]) this.state.inventory[itemId] = 0;
                this.state.inventory[itemId]++;
                this.save();
                return true;
            }
        } else {
            if(this.state.money >= item.price) {
                this.updateMoney(-item.price);
                if(!this.state.inventory[itemId]) this.state.inventory[itemId] = 0;
                this.state.inventory[itemId]++;
                this.save();
                return true;
            }
        }
        return false;
    }
    
    consumeItem(itemId) {
        if(this.state.inventory[itemId] > 0) {
            this.state.inventory[itemId]--;
            this.save();
            return true;
        }
        return false;
    }
    
    save() {
        localStorage.setItem('muse_gamestate_v2', JSON.stringify(this.state));
        this.updateUI();
    }
    
    updateMoney(amount) {
        this.state.money += amount;
        this.save();
    }
    
    updateDiamonds(amount) {
        this.state.diamonds += amount;
        this.save();
    }
    
    incrementAction() {
        if (typeof this.state.actionCount === 'undefined') {
            this.state.actionCount = 0;
        }
        this.state.actionCount++;
        this.save();
        
        if (typeof cardEngine !== 'undefined') {
            const idols = cardEngine.getAllIdols();
            let changed = false;
            idols.forEach(idol => {
                const ups = idol.condoUpgrades || {};
                if (ups['bed']) {
                    idol.stress = Math.max(0, (idol.stress || 0) - 1);
                    changed = true;
                }
                
                // Random Scandal Check (15% chance if scandal > 50)
                if (idol.scandalRisk > 50 && Math.random() < 0.15) {
                    if (typeof gameApp !== 'undefined' && gameApp.triggerScandalCrisis) {
                        setTimeout(() => gameApp.triggerScandalCrisis(idol.id), 1000);
                    }
                }
            });
            if (changed) idols.forEach(idol => dbManager.saveIdolData(idol));
        }

        if (this.state.actionCount % 10 === 0) {
            if (typeof gameApp !== 'undefined') {
                if (gameApp.triggerRandomEvent) {
                    gameApp.triggerRandomEvent();
                } else if (gameApp.triggerFashionWeek) {
                    gameApp.triggerFashionWeek();
                }
            }
        }
    }
    
    updateUI() {
        const moneyEl = document.getElementById('ui-money');
        const diaEl = document.getElementById('ui-diamonds');
        if (moneyEl) moneyEl.textContent = this.state.money.toLocaleString();
        if (diaEl) diaEl.textContent = this.state.diamonds.toLocaleString();
    }
    
    checkAchievement(action, data = null) {
        let changed = false;
        for (let ach of this.achievementsList) {
            if (this.state.achievements.includes(ach.id)) continue;

            let unlocked = false;
            if (action === 'SCOUT' && ach.id === 'FIRST_SCOUT') unlocked = true;
            if (action === 'SHOOT' && ach.id === 'FIRST_SHOOT') unlocked = true;
            if (action === 'ROSTER_UPDATE' && ach.id === 'ROSTER_3' && typeof cardEngine !== 'undefined' && cardEngine.roster.size >= 3) unlocked = true;
            if (action === 'STATS_UPDATE' && ach.id === 'FAME_50') {
                if (data && data.fame >= 50) unlocked = true;
            }
            if (action === 'PHOTO_SAVED' && ach.id === 'PHOTOGRAPHER') {
                if (data && data >= 5) unlocked = true;
            }
            if (action === 'VIP_SCOUT' && ach.id === 'VIP_CASTING') unlocked = true;
            if (action === 'LEVEL_UP' && ach.id === 'LEVEL_10') {
                if (data && data.level >= 10) unlocked = true;
            }

            if (unlocked) {
                this.state.achievements.push(ach.id);
                this.updateDiamonds(ach.reward);
                changed = true;
                if (typeof gameApp !== 'undefined') {
                    gameApp.showToast(`🏆 Thành tựu Mở khóa: ${ach.title} (+${ach.reward} 💎)`, 'success');
                }
            }
        }
        if (changed) {
            this.save();
            if (typeof gameApp !== 'undefined') gameApp.renderAchievements();
        }
    }
}
const gameManager = new GameManager();
