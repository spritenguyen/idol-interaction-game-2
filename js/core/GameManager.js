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
            // Thể lực & Sức khỏe (HP/Stress) - category: health
            { id: 'item_drink', name: '🥤 Matcha Latte', desc: 'Giảm 20 Căng thẳng (Stress)', price: 150, type: 'stress', effect: -20, category: 'health' },
            { id: 'item_energy', name: '⚡ Nước Tăng Lực VIP', desc: 'Giảm cực nhanh 50 Căng thẳng nhưng tăng 5 Tha hóa do ép bản thân', price: 250, type: 'stress_heavy', effect: -50, category: 'health' },
            
            // Giảm cân & Làm đẹp - category: beauty
            { id: 'item_meal', name: '🥗 Salad Cá hồi', desc: 'Giảm cân (-1kg), Giảm 10 Căng thẳng', price: 200, type: 'weight_down', effect: -1, category: 'beauty' },
            { id: 'item_diet_pill', name: '💊 Thuốc Giảm Cân', desc: 'Giảm nhanh 3kg nhưng Tăng 30 Stress & 10 Tha hóa', price: 400, type: 'weight_fast', effect: -3, category: 'beauty' },
            { id: 'item_skincare', name: '✨ Bộ Dưỡng Da La Mer', desc: 'Tăng 10 Visual, Phục hồi Tâm trạng', price: 800, type: 'visual', effect: 10, category: 'beauty' },
            { id: 'item_dress', name: '👗 Váy Gucci Couture', desc: 'Tăng 10 Visual, Phục hồi Tâm trạng', price: 1500, type: 'visual', effect: 10, category: 'beauty' },

            // Quà Tặng & Quan hệ (Affinity) - category: gift
            { id: 'item_perfume', name: '✨ Chanel No.5', desc: 'Tăng 30 Hảo cảm (Affinity)', price: 500, type: 'affinity', effect: 30, category: 'gift' },
            { id: 'item_luxury_bag', name: '👜 Túi xách Hermes', desc: 'Quà tặng xa xỉ: Tăng 50 Hảo cảm, Tăng 15 Visual', price: 5000, type: 'gift_luxury', effect: 50, category: 'gift' },

            // Đào Tạo & Kỹ Năng (EXP) - category: training
            { id: 'item_course', name: '📚 Khóa diễn xuất', desc: 'Tăng 50 EXP ngay lập tức', price: 800, type: 'exp', effect: 50, category: 'training' },
            { id: 'item_catwalk', name: '👠 Khóa Catwalk Chuyên Sâu', desc: 'Tăng 100 EXP, Tăng 2 Danh tiếng', price: 1500, type: 'exp', effect: 100, category: 'training' },
            { id: 'item_masterclass', name: '🎓 Masterclass VIP', desc: 'Tăng 200 EXP, Tăng 5 Danh tiếng (Fame)', price: 2500, type: 'exp_high', effect: 200, category: 'training' },

            // Diamond Items - category: premium
            { id: 'item_diamond_ring', name: '💍 Nhẫn Kim Cương', desc: 'Sức mạnh tuyệt đối: Tăng 100 Hảo Cảm & 30 Visual', price: 20, currency: 'diamond', type: 'gift_diamond', effect: 100, category: 'premium' },
            { id: 'item_media_ticket', name: '🎟️ Thẻ Truyền Thông VIP', desc: 'Tăng ngay 50 Danh tiếng (Fame) & Tẩy trắng scandal', price: 50, currency: 'diamond', type: 'media_vip', effect: 50, category: 'premium' },
            { id: 'item_money_bag', name: '💰 Quỹ Hỗ Trợ Khẩn', desc: 'Quy đổi: Nhận ngay 10,000 Tiền mặt ngân sách', price: 30, currency: 'diamond', type: 'exchange_money', effect: 10000, category: 'premium' },
            
            // Outfits - category: outfit
            { id: 'outfit_swimsuit', name: '👙 Bikini Ánh Kim', desc: 'Trang phục quyến rũ. Bổ sung vào Kho đồ Model.', price: 1500, type: 'outfit', effect: 'Metallic Bikini Swimsuit', category: 'outfit' },
            { id: 'outfit_goth', name: '👗 Váy Goth Lolita', desc: 'Trang phục ma mị. Bổ sung vào Kho đồ Model.', price: 2000, type: 'outfit', effect: 'Gothic Lolita Dress, dark elegant', category: 'outfit' },
            { id: 'outfit_cyber', name: '🕶️ Áo Khoác Cyberpunk', desc: 'Trang phục viễn tưởng. Bổ sung vào Kho đồ Model.', price: 2500, type: 'outfit', effect: 'Cyberpunk neon jacket, futuristic style', category: 'outfit' },
            { id: 'outfit_elegant', name: '🥻 Dạ hội Thượng Lưu', desc: 'Trang phục sang trọng. Bổ sung vào Kho đồ Model.', price: 3000, type: 'outfit', effect: 'Elegant high-fashion evening gown', category: 'outfit' },
            { id: 'outfit_bunny', name: '🐰 Đồ Thỏ Ngọc', desc: 'Hơi hư hỏng. Bổ sung vào Kho đồ Model.', price: 30, currency: 'diamond', type: 'outfit', effect: 'Playboy bunny suit outfit, cute and sexy', category: 'premium' },
            
            // Giày Cao Gót - category: shoes
            { id: 'shoes_louboutin', name: '👠 Đế Đỏ (Louboutin)', desc: 'Tăng 20 Visual, tăng 5 Fame.', price: 2000, type: 'shoes_visual', effect: 20, promptEffect: 'wearing Christian Louboutin red bottom heels', category: 'shoes' },
            { id: 'shoes_glass', name: '👡 Giày Thủy Tinh (Jimmy Choo)', desc: 'Tăng 35 Visual siêu sang, tăng 10 Fame.', price: 4000, type: 'shoes_visual', effect: 35, promptEffect: 'wearing Jimmy Choo glass slippers heels', category: 'shoes' },
            { id: 'shoes_boots', name: '👢 Boots Da Đen', desc: 'Tăng 15 Visual, giảm 10 Stress.', price: 1500, type: 'shoes_active', effect: 15, promptEffect: 'wearing black leather boots', category: 'shoes' },

            // Trang Sức - category: accessories
            { id: 'acc_necklace', name: '💎 Dây Chuyền Diamond', desc: 'Trang sức xa xỉ. Bổ sung vào Tủ Đồ.', price: 3500, type: 'accessory', effect: 'wearing expensive diamond necklace', category: 'accessories' },
            { id: 'acc_earrings', name: '✨ Hoa Tai Ngọc Trai', desc: 'Trang sức thanh lịch. Bổ sung vào Tủ Đồ.', price: 1500, type: 'accessory', effect: 'wearing elegant pearl earrings', category: 'accessories' },
            { id: 'acc_sunglasses', name: '🕶️ Kính Râm Hàng Hiệu', desc: 'Trang sức cực ngầu. Bổ sung vào Tủ Đồ.', price: 1200, type: 'accessory', effect: 'wearing stylish designer sunglasses', category: 'accessories' }
        ];
        this.blackMarketItems = [
            { id: 'bm_steroid', name: '💉 Tiêm Hóa Chất (Siêu Tốc)', desc: 'Tăng ngay 30 Visual, nhưng tăng 15% Scandal Risk & 20 Tha hóa', price: 3000, type: 'bm_visual', effect: 30 },
            { id: 'bm_brainwash', name: '🧠 Khóa Đào Tạo Tâm Lý Đen', desc: 'Giảm 100 Stress, nhưng Model mất 30 Hảo cảm và Mất nhân tính (+30 Tha hóa, +10% Scandal)', price: 2000, type: 'bm_brainwash', effect: -100 },
            { id: 'bm_fake_news', name: '📰 Mua Truyền Thông Bẩn', desc: 'Tăng ảo 20 Fame, nhưng tạo ra 25% Scandal Risk tiềm ẩn.', price: 5000, type: 'bm_fame', effect: 20 },
            { id: 'bm_wipe_scandal', name: '🕵️ Mua Chuộc Giới Báo Chí', desc: 'Giảm 30% Scandal Risk hiện tại. Rất đắt đồ.', price: 10000, type: 'bm_wipe', effect: -30 },
            { id: 'bm_sabotage_rivals', name: '💣 Bài Bóc Phốt (Sabotage)', desc: 'Thuê hacker & lều báo tấn công đối thủ ngẫu nhiên trên BXH, hạ rank của chúng. Tăng 10% Scandal Risk cho Cty.', price: 4000, type: 'bm_sabotage_rivals', effect: 0 }
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
            // E-tier (Khởi điểm)
            { icon: '☕', name: 'Nhân viên phục vụ part-time', reqFame: 0, reward: 200, stress: 20, exp: 5 },
            { icon: '📸', name: 'Mẫu Lookbook thời trang mạng', reqFame: 10, reward: 400, stress: 10, exp: 15 },
            // D-tier (Vừa có chút tiếng)
            { icon: '🎬', name: 'Quần chúng MV Ca nhạc', reqFame: 30, reward: 800, stress: 25, exp: 35 },
            { icon: '📸', name: 'Chụp hình Tạp chí GenZ', reqFame: 50, reward: 1500, stress: 15, exp: 60 },
            // C-tier (Ổn định)
            { icon: '📺', name: 'Đóng Quảng cáo Trà sữa', reqFame: 100, reward: 2500, stress: 30, exp: 100 },
            { icon: '💃', name: 'Dancer minh hoạ liveshow', reqFame: 120, reward: 3000, stress: 45, exp: 120 },
            // B-tier (Khá nổi tiếng)
            { icon: '👠', name: 'Catwalk Tuần lễ thời trang', reqFame: 200, reward: 5500, stress: 60, exp: 200 },
            { icon: '🎤', name: 'Khách mời Talkshow', reqFame: 250, reward: 7000, stress: 40, exp: 180 },
            // A-tier (Hạng A)
            { icon: '🎬', name: 'Nữ phụ Phim Truyền Hình', reqFame: 400, reward: 15000, stress: 70, exp: 400 },
            { icon: '✨', name: 'Gương mặt đại diện Local Brand', reqFame: 500, reward: 22000, stress: 55, exp: 500 },
            // S-tier (Super Star)
            { icon: '👑', name: 'Đại sứ Toàn cầu Thương hiệu Mỹ phẩm', reqFame: 800, reward: 50000, stress: 80, exp: 1000 },
            { icon: '✈️', name: 'World Tour Đặc Quyền', reqFame: 1200, reward: 120000, stress: 90, exp: 2500 }
        ];
        
        this.currentJobs = [];
        
        // Shuffle and pick 4
        let shuffled = [...jobTypes].sort(() => 0.5 - Math.random());
        for(let i=0; i<4; i++) {
            this.currentJobs.push({ ...shuffled[i], id: 'job_' + Date.now() + i });
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

                // Random Headhunting Check (10% chance if stress > 50 or affinity < 40)
                if ((idol.stress > 50 || (idol.affinity || 30) < 40) && Math.random() < 0.1) {
                    if (typeof gameApp !== 'undefined' && gameApp.triggerHeadhunting) {
                        setTimeout(() => gameApp.triggerHeadhunting(idol.id), 2500);
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
