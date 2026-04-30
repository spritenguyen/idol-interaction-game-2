class StudioDirector {
    constructor() {
        this.isRendering = false;
    }

    async _craftCinematicPrompt(idol, userConcept) {
        let emotionalContext = "";
        let visualModifiers = [];

        // Hệ thống "Real-time AI Visual Context"
        const corruption = idol.corruption || 0;
        const stress = idol.stress || 0;
        const affinity = idol.affinity || 0;

        if (corruption > 50) {
            visualModifiers.push("dark makeup, intense gaze, mysterious aura, gothic elements");
            emotionalContext += "She is deeply immersed in the dark side of fame (corrupted). ";
        }
        if (stress > 80) {
            visualModifiers.push("tired expression, messy hair, dimly lit, melancholic mood");
            emotionalContext += "She is extremely stressed, exhausted and emotionally drained. ";
        }
        if (affinity > 80) {
            visualModifiers.push("soft eyes, relaxed posture, subtle warm glow");
            emotionalContext += "She feels very comfortable and affectionate towards the camera. ";
        }

        let outfitContext = "";
        if (typeof gameManager !== 'undefined') {
            if (idol.equippedOutfit) {
                const outfitItem = gameManager.shopItems.find(i => i.id === idol.equippedOutfit);
                if (outfitItem && outfitItem.effect) {
                    outfitContext += `\nMANDATORY OUTFIT FOR THIS SHOOT: The model MUST wear "${outfitItem.effect}". Include this exactly in the visualPrompt.`;
                }
            }
            if (idol.equippedShoe) {
                const shoeItem = gameManager.shopItems.find(i => i.id === idol.equippedShoe);
                if (shoeItem && shoeItem.promptEffect) {
                    outfitContext += `\nMANDATORY SHOES: The model MUST wear "${shoeItem.promptEffect}". IMPORTANT: Enforce FULL-BODY shot or wide-angle framing so the shoes are visible. Mention this directly in the visualPrompt.`;
                }
            }
            if (idol.equippedAccessory) {
                const accItem = gameManager.shopItems.find(i => i.id === idol.equippedAccessory);
                if (accItem && (accItem.promptEffect || accItem.effect)) {
                    const effectStr = accItem.promptEffect || accItem.effect;
                    outfitContext += `\nMANDATORY ACCESSORY: The model MUST wear "${effectStr}". Mention this directly in the visualPrompt.`;
                }
            }
        }

        const extraPrompts = visualModifiers.length > 0 ? ` Always include these visual elements: [${visualModifiers.join(' | ')}].` : '';

        const nat = idol.nationality && idol.nationality !== "Unknown" ? ` (` + idol.nationality + `)` : '';
        const ageStr = idol.age ? ` ${idol.age}yo` : '';
        const realStr = idol.isReal ? `REAL-LIFE CELEBRITY: The subject is a well-known real person. You MUST explicitly include "${idol.name}" and their likeness in the generated visualPrompt. Ensure the generated image accurately reflects the real-life facial features of ${idol.name}.` : `FICTIONAL MODEL.`;
        
        let measurementsContext = "";
        if (idol.measurements) {
            measurementsContext = `\nModel physical traits: Height ${idol.measurements.height || '?'}, Weight ${idol.measurements.weight || '?'}. Incorporate this body type naturally into the visual prompt.`;
        }
        
        let preciseTraitsContext = "";
        if (idol.physicalTraits) {
            preciseTraitsContext = `\nMANDATORY FACIAL/PHYSICAL FEATURES: "${idol.physicalTraits}". You MUST include these exact physical details in the generated visualPrompt to ensure face/body consistency.`;
        }

        const systemPrompt = `You are a visionary Art Director & Lead Cinematic Photographer. 
        Your task is to craft a world-class, highly detailed English image generation prompt for a top fashion model named "${idol.name}"${ageStr}${nat}.
        ${realStr}
        Her foundational concept/style: "${idol.concept}".${measurementsContext}${preciseTraitsContext}
        User's creative vision for this shoot: "${userConcept}".${outfitContext}
        ${emotionalContext}
        
        INSTRUCTIONS:
        1. Contextual Scene Setup: Parse the user's creative vision. If they described an outfit, location, pose, or mood, integrate it perfectly with the overarching concept.
        2. Priority Framing: VERY IMPORTANT - Frame the shot according to the user's pose/vision (e.g. if close-up, do not use full-body). If no specific pose/framing is mentioned, prioritize FULL-BODY SHOTS.
        
        OUTPUT STRICTLY IN JSON FORMAT DO NOT OUTPUT MARKDOWN. JSON format:
        {
          "visualPrompt": "[Cinematic English prompt containing: Subject, Outfit, Pose, Background, Framing, Lighting${extraPrompts}]",
          "technicalSpecs": "Camera: [Model], Lens: [Focal Length]mm f/[Aperture], Look: [Style]"
        }`;

        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            
            let result = (provider === 'gemini') ? await service.generateContent(systemPrompt) : await service.generateText(systemPrompt);
            let jsonStr = result;
            const match = result.match(/\{[\s\S]*\}/);
            if (match) jsonStr = match[0];
            else jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);
            
            // Tối ưu hóa render: Chống lỗi giải phẫu
            const anatomyOptimization = "perfect human anatomy, highly detailed symmetrical beautiful face, flawless realistic natural eyes, perfect detailed hands and fingers, perfect proportional legs, 5 fingers, realistic body proportions, masterpiece, 8k resolution, photorealistic. NO deformed, NO bad anatomy, NO bad hands, NO missing fingers, NO extra digits, NO asymmetrical face, NO cross-eyed, NO unnatural body";
            
            return {
                prompt: `${data.visualPrompt}, ${anatomyOptimization}`,
                techBase: data.technicalSpecs
            };
        } catch (error) {
            const extraFallback = visualModifiers.length > 0 ? `, ${visualModifiers.join(', ')}` : '';
            const anatomyOptimization = "perfect human anatomy, symmetrical beautiful face, nice clear eyes, perfect hands, correct legs, masterpiece, 8k. NO deformed, NO bad anatomy, NO bad hands, NO missing fingers, NO extra digits, NO asymmetrical face, NO cross-eyed";
            return {
                prompt: `Cinematic fashion portrait, ${idol.name}, ${idol.concept}, ${userConcept}, professional lighting, ${anatomyOptimization}${extraFallback}`,
                techBase: "Camera: Sony A7RV, Lens: 85mm f/1.4 GM, Simulation: Kodak Portra 400"
            };
        }
    }

    async executePhotoshoot(idolId, userConcept, imageModel) {
        if (this.isRendering) return null;
        this.isRendering = true;
        
        const idol = cardEngine.getIdol(idolId);
        if (!idol) { this.isRendering = false; return null; }
        
        try {
            const specs = await this._craftCinematicPrompt(idol, userConcept);
            const imageUrl = await pollinationsService.generateImage(specs.prompt, imageModel);
            
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
