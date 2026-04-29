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
        if (idol.equippedOutfit && idol.outfits) {
            const outfitObj = idol.outfits.find(o => o.id === idol.equippedOutfit);
            if (outfitObj) {
                outfitContext = `\nMANDATORY OUTFIT FOR THIS SHOOT: The model MUST wear "${outfitObj.promptEffect}". Include this exactly in the visualPrompt.`;
            }
        }

        const extraPrompts = visualModifiers.length > 0 ? ` Always include these visual elements: [${visualModifiers.join(' | ')}].` : '';

        const nat = idol.nationality && idol.nationality !== "Unknown" ? ` (` + idol.nationality + `)` : '';
        const systemPrompt = `You are a visionary Art Director & Lead Cinematic Photographer. 
        Your task is to craft a world-class, highly detailed English image generation prompt for a top fashion model named "${idol.name}"${nat}.
        Her foundational concept/style: "${idol.concept}".
        User's creative vision for this shoot: "${userConcept}".${outfitContext}
        ${emotionalContext}
        
        INSTRUCTIONS:
        1. Contextual Scene Setup: Parse the user's creative vision. If they described an outfit, location, or mood, integrate it perfectly with the overarching concept.
        2. Priority Framing: VERY IMPORTANT - Prioritize FULL-BODY SHOTS unless the user specifies otherwise.
        
        OUTPUT STRICTLY IN JSON FORMAT DO NOT OUTPUT MARKDOWN. JSON format:
        {
          "visualPrompt": "[Cinematic English prompt containing: Subject, Outfit, Pose, Background, Lighting${extraPrompts}]",
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
