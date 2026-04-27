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

        const extraPrompts = visualModifiers.length > 0 ? ` Always include these visual elements: [${visualModifiers.join(' | ')}].` : '';

        const systemPrompt = `You are a visionary Art Director & Lead Cinematic Photographer. 
        Your task is to craft a world-class, highly detailed English image generation prompt for a top fashion model named "${idol.name}".
        Her foundational concept/style: "${idol.concept}".
        User's creative vision for this shoot: "${userConcept}".
        ${emotionalContext}
        
        INSTRUCTIONS:
        1. Contextual Scene Setup: Parse the user's creative vision. If they described an outfit, location, or mood, integrate it perfectly with the overarching concept.
        2. Director's Vision: Automatically deduce and specify the BEST camera lens (e.g., 85mm f/1.2, 35mm, 200mm), lighting setup (e.g., cinematic rim lighting, neon, golden hour, chiaroscuro), and film stock.
        3. Priority Framing: VERY IMPORTANT - Prioritize FULL-BODY SHOTS (e.g., "full body shot", "wide angle", "head to toe", "showing full outfit and figure") unless the user explicitly asks for a close-up. Make sure she is the clear central focus.
        4. ${extraPrompts}
        5. The final output must be photorealistic, masterpiece, 8k resolution.
        
        Output ONLY the English prompt string, nothing else. No markdown formatting.`;

        try {
            const provider = document.getElementById('logic-provider').value;
            const service = (provider === 'gemini') ? geminiService : pollinationsService;
            
            let result = (provider === 'gemini') ? await service.generateContent(systemPrompt) : await service.generateText(systemPrompt);
            if (!result || result.length < 20) throw new Error("Low quality response");

            return result.trim().replace(/['"«»*]/g, '');
        } catch (error) {
            const extraFallback = visualModifiers.length > 0 ? `, ${visualModifiers.join(', ')}` : '';
            return `Cinematic fashion portrait, ${idol.name}, ${idol.concept}, ${userConcept}, professional lighting, masterpiece, 8k${extraFallback}`;
        }
    }

    async executePhotoshoot(idolId, userConcept, imageModel) {
        if (this.isRendering) return null;
        this.isRendering = true;
        
        const idol = cardEngine.getIdol(idolId);
        if (!idol) { this.isRendering = false; return null; }
        
        try {
            const finalPrompt = await this._craftCinematicPrompt(idol, userConcept);
            pollinationsService.currentImageModel = imageModel;
            const imageUrl = await pollinationsService.generateImage(finalPrompt);
            
            this.isRendering = false;
            if (!imageUrl) return null;
            return { promptUsed: finalPrompt, imageUrl: imageUrl };
        } catch (error) { 
            this.isRendering = false; 
            return null; 
        }
    }
}
const studioDirector = new StudioDirector();
