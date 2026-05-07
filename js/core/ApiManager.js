class ApiManager {
    constructor() {
        this.proxyUrl = 'https://pollinations-proxy.spritenguyen.workers.dev';
        this.geminiFailed = false; // Flag to track if gemini has run out of its limit
        this.pollenExhausted = false; // Flag to track if proxy is out of pollen
    }

    async verifyAndSetGemini() {
        const geminiKeyInput = document.getElementById('gemini-key');
        if (!geminiKeyInput) return false;
        const geminiKey = geminiKeyInput.value.trim();
        if (geminiKey && !this.geminiFailed) {
            if (typeof geminiService !== 'undefined') {
                geminiService.setKey(geminiKey);
                const geminiModel = document.getElementById('gemini-model');
                if (geminiModel && geminiModel.value) {
                    geminiService.setModel(geminiModel.value);
                }
                return true;
            }
        }
        return false;
    }

    async generateText(prompt) {
        if (typeof gameApp !== 'undefined') gameApp.setApiState("Generating...", "is-active");
        
        // 1. If user set Gemini Key, try Gemini first
        const useGemini = await this.verifyAndSetGemini();
        if (useGemini) {
            try {
                // Ensure json format if needed (detect from prompt)
                const isJson = prompt.toLowerCase().includes("json");
                let result = await geminiService.generateContent(prompt, { json: isJson }, 2); 
                if (result) {
                    if (typeof gameApp !== 'undefined') gameApp.setApiState("Idle");
                    return result;
                }
            } catch (error) {
                console.warn("[ApiManager] Gemini usage failed or limited:", error);
                if (error.message === 'GEMINI_QUOTA_EXCEEDED' || String(error).includes('429')) {
                    this.geminiFailed = true;
                    if (typeof gameApp !== 'undefined') {
                        gameApp.showToast("Gemini hết hạn mức quota, tự động chuyển về Pollinations Proxy!", "warning");
                    }
                }
            }
        }

        // 2. Pollinations Flow (Proxy -> Free)
        let model = document.getElementById('polli-text-model')?.value || 'openai';
        
        // Try Proxy
        if (!this.pollenExhausted) {
            try {
                const proxyBaseUrl = this.proxyUrl + "/v1/chat/completions";
                const response = await fetch(proxyBaseUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
                });

                if (response.status === 429 || response.status === 402) {
                    console.warn("[ApiManager] Proxy ran out of pollen, switching to FREE endpoint!");
                    this.pollenExhausted = true;
                    if (typeof gameApp !== 'undefined') {
                        gameApp.showToast("Proxy đã cạn phấn hoa, tự động chuyển sang điểm phát miễn phí (Free Endpoint)!", "error");
                        gameApp.updateApiStatusWidget();
                    }
                } else if (response.ok) {
                    const data = await response.json();
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        if (typeof gameApp !== 'undefined') gameApp.setApiState("Idle");
                        return data.choices[0].message.content;
                    }
                }
            } catch (e) {
                console.warn("[ApiManager] Proxy Text Error:", e);
                // Switch to free on network error too
                this.pollenExhausted = true;
                if (typeof gameApp !== 'undefined') gameApp.updateApiStatusWidget();
            }
        }

        // Try Free Endpoint if proxy exhausted
        console.log(`[ApiManager] Falling back to text.pollinations.ai...`);
        try {
            const freeBaseUrl = "https://text.pollinations.ai/";
            const res = await fetch(freeBaseUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: model })
            });
            if (res.ok) {
                const text = await res.text();
                if (typeof gameApp !== 'undefined') gameApp.setApiState("Idle");
                if (text) return text;
            } else if (res.status === 429) {
                 // Try resetting proxy if free is also limited. Sometimes both limit
                 // We could periodically reset. Let's just reset flag for next call
                 this.pollenExhausted = false; 
            }
        } catch (e) {
            console.error("[ApiManager] Free Text Error:", e);
        }

        if (typeof gameApp !== 'undefined') {
            gameApp.setApiState("Failed", "is-error");
            setTimeout(() => gameApp.setApiState("Idle"), 3000);
        }
        return "{}"; // Safe fallback
    }
}

const apiManager = new ApiManager();
