class GeminiService {
    constructor() {
        this.apiKey = null;
        this.models = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'];
        this.currentModelIndex = 0;
        this.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/";
    }

    setKey(key) { this.apiKey = key.trim(); }
    setModel(modelName) { 
        let idx = this.models.indexOf(modelName);
        this.currentModelIndex = idx !== -1 ? idx : 0;
    }

	async generateContent(prompt, options = {}, retries = 5) {
		if (!this.apiKey) throw new Error("Missing Gemini API Key");

		const payload = {
		    contents: [{ parts: [{ text: prompt }] }]
		};
		if (options.json) {
		    payload.generationConfig = { responseMimeType: "application/json" };
		}
        
        let modelsToTry = [
            ...this.models.slice(this.currentModelIndex),
            ...this.models.slice(0, this.currentModelIndex)
        ];

        for (const model of modelsToTry) {
            const url = `${this.endpoint}${model}:generateContent?key=${this.apiKey}`;
            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                            this.currentModelIndex = this.models.indexOf(model);
                            return data.candidates[0].content.parts[0].text;
                        }
                    }

                    if (response.status === 503) {
                        await new Promise(res => setTimeout(res, 2000));
                        continue;
                    }
                    if (response.status === 429) {
                        // Rate limited on this model, break inner loop to switch to next model
                        break;
                    }
                    // For other errors like 400
                    break;
                } catch (error) {
                    if (i === retries - 1) console.error(`Gemini Error on ${model}:`, error);
                }
            }
        }
        
        // If all Gemini models failed (e.g. daily quota reached), throw specific error
        throw new Error("GEMINI_QUOTA_EXCEEDED");
	}
}
const geminiService = new GeminiService();
