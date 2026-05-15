class StudioDirector {
    constructor() {
        this.isRendering = false;
    }

    async _craftCinematicPrompt(idol, userConcept, cameraOverrides = {}) {
        let emotionalContext = "";
        let visualModifiers = [];

        // Hệ thống "Real-time AI Visual Context"
        const corruption = idol.corruption || 0;
        const stress = idol.stress || 0;
        const affinity = idol.affinity || 0;

        if (corruption > 50) {
            visualModifiers.push("dark makeup, intense gaze, mysterious aura, gothic elements");
            emotionalContext += "deeply immersed in the dark side of fame";
        }
        if (stress > 80) {
            visualModifiers.push("tired expression, messy hair, dimly lit, melancholic mood");
            emotionalContext += "extremely stressed and emotionally drained";
        }
        if (affinity > 80) {
            visualModifiers.push("soft eyes, relaxed posture, subtle warm glow");
            emotionalContext += "comfortable and affectionate towards the camera";
        }

        let outfitContext = "";
        if (typeof gameManager !== 'undefined') {
            if (cameraOverrides.outfitPreset) {
                outfitContext += ", wearing " + cameraOverrides.outfitPreset;
            }
            if (cameraOverrides.equippedItems && cameraOverrides.equippedItems.length > 0) {
                outfitContext += ", accessorized with " + cameraOverrides.equippedItems.join(" and ");
            } else {
                if (idol.equippedOutfit) {
                    const outfitItem = gameManager.shopItems.find(i => i.id === idol.equippedOutfit);
                    if (outfitItem && outfitItem.effect) {
                        outfitContext += `, wearing ${outfitItem.effect}`;
                    }
                }
                if (idol.equippedShoe) {
                    const shoeItem = gameManager.shopItems.find(i => i.id === idol.equippedShoe);
                    if (shoeItem && shoeItem.promptEffect) {
                        outfitContext += `, wearing shoes ${shoeItem.promptEffect}, full-body shot to show shoes`;
                    }
                }
                if (idol.equippedAccessory) {
                    const accItem = gameManager.shopItems.find(i => i.id === idol.equippedAccessory);
                    if (accItem && (accItem.promptEffect || accItem.effect)) {
                        const effectStr = accItem.promptEffect || accItem.effect;
                        outfitContext += `, wearing accessory ${effectStr}`;
                    }
                }
            }
        }

        if (cameraOverrides.lighting) {
            visualModifiers.push(cameraOverrides.lighting + " lighting");
        }
        if (cameraOverrides.lens) {
            visualModifiers.push(cameraOverrides.lens + " shot");
        }

        const extraPrompts = visualModifiers.length > 0 ? ` [${visualModifiers.join(', ')}] ` : '';

        const nat = idol.nationality && idol.nationality !== "Unknown" ? ` (` + idol.nationality + `)` : '';
        const ageStr = idol.age ? ` ${idol.age}yo` : '';
        const realStr = idol.isReal ? `real-life celebrity likeness of ${idol.name}` : `fashion model`;
        
        let measurementsContext = "";
        if (idol.measurements) {
            measurementsContext = `Height ${idol.measurements.height || '?'}, Weight ${idol.measurements.weight || '?'}`;
        }
        
        let preciseTraitsContext = "";
        if (idol.physicalTraits) {
            preciseTraitsContext = `, physical traits: ${idol.physicalTraits}`;
        }

        // Tối ưu hóa render: Chống lỗi giải phẫu
        const anatomyOptimization = "perfect human anatomy, symmetrical beautiful face, highly detailed flawless realistic natural eyes, perfect detailed hands and fingers, perfect proportional legs, exactly 5 fingers per hand, realistic body proportions, masterpiece, photorealistic, 8k resolution. NO deformed, NO bad anatomy, NO bad hands, NO missing fingers, NO extra digits, NO asymmetrical face, NO cross-eyed, NO unnatural body, NO mutated hands, NO extra limbs";

        // Xây dựng prompt viết riêng cho model (nội suy programmatic) để tối ưu hiệu suất tối đa (không cần chờ text LLM)
        const cinematicPrompt = `Cinematic professional photoshoot of ${idol.name}, a ${ageStr} ${realStr}${nat}. Concept: ${idol.concept}. User vision: ${userConcept}.${outfitContext}. ${measurementsContext}${preciseTraitsContext}. Mood/State: ${emotionalContext}. ${extraPrompts}. Professional studio lighting, global illumination, highly detailed environment. ${anatomyOptimization}`;
        
        const techBase = `Camera: Sony A7RV, Lens: ${cameraOverrides.lens || '85mm f/1.4 GM'}, Lighting: ${cameraOverrides.lighting || 'Studio Standard'}, Simulation: Kodak Portra 400`;
        
        // Trả về ngay lập tức
        return {
            prompt: cinematicPrompt,
            techBase: techBase,
            width: cameraOverrides.width || 1024,
            height: cameraOverrides.height || 1024
        };
    }

    async executePhotoshoot(idolId, userConcept, imageModel, cameraOverrides = {}) {
        if (this.isRendering) return null;
        this.isRendering = true;
        
        const idol = cardEngine.getIdol(idolId);
        if (!idol) { this.isRendering = false; return null; }
        
        try {
            const specs = await this._craftCinematicPrompt(idol, userConcept, cameraOverrides);
            const imageUrl = await pollinationsService.generateImage(specs.prompt, imageModel, false, specs.width, specs.height);
            
            this.isRendering = false;
            if (!imageUrl) return null;
            return { promptUsed: specs.prompt, technicalSpecs: specs.techBase, imageUrl: imageUrl };
        } catch (error) { 
            this.isRendering = false; 
            return null; 
        }
    }
}
const studioDirector = new StudioDirector();
