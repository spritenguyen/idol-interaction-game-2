class GeminiService {
    constructor() {
        this.apiKey = null;
        this.currentModel = 'gemini-3.1-flash-lite-preview';
        this.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/";
    }

    setKey(key) { this.apiKey = key.trim(); }
    setModel(modelName) { this.currentModel = modelName; }

	async generateContent(prompt, options = {}, retries = 5) {
		if (!this.apiKey) throw new Error("Missing Gemini API Key");

		const url = `${this.endpoint}${this.currentModel}:generateContent?key=${this.apiKey}`;
		
		const payload = {
		    contents: [{ parts: [{ text: prompt }] }]
		};
		if (options.json) {
		    payload.generationConfig = { responseMimeType: "application/json" };
		}
		
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
						return data.candidates[0].content.parts[0].text;
					}
				}

				if (response.status === 503 || response.status === 429) {
					await new Promise(res => setTimeout(res, 2000));
					continue;
				}
				break;
			} catch (error) {
				if (i === retries - 1) console.error("Gemini Error:", error);
			}
		}
		return null; 
	}
}
const geminiService = new GeminiService();
