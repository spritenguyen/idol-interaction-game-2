class PollinationsService {
    constructor() {
        this.config = { sk_key: null, isAnonymous: true };
        this.textModels = ['grok', 'gemini-fast'];
        this.currentTextModelIndex = 0;
        
        this.imageModels = ['flux', 'zimage', 'qwen-image', 'gptimage-large'];
        this.currentImageModelIndex = 0;
        
        this.endpoints = {
            secured: { image: 'https://gen.pollinations.ai/image', text: 'https://gen.pollinations.ai/v1/chat/completions' },
            free: { image: 'https://image.pollinations.ai/prompt', text: 'https://text.pollinations.ai/' }
        };
    }

    /* Additional Setters for index logic */
    setTextModel(modelName) { 
        let idx = this.textModels.indexOf(modelName);
        this.currentTextModelIndex = idx !== -1 ? idx : 0;
    }
    setImageModel(modelName) {
        let idx = this.imageModels.indexOf(modelName);
        this.currentImageModelIndex = idx !== -1 ? idx : 0;
    }

    updateCredential(inputString) {
        inputString = (inputString || '').trim();
        if (!inputString) {
            this.config.sk_key = null;
            this.config.proxyUrl = null;
            this.config.isAnonymous = true;
            return 'free_mode';
        }
        
        if (inputString.startsWith('http://') || inputString.startsWith('https://')) {
            this.config.proxyUrl = inputString;
            this.config.sk_key = null; // or perhaps keep a dummy key if needed
        } else {
            this.config.sk_key = inputString;
            this.config.proxyUrl = null;
        }

        this.config.isAnonymous = false;
        return 'secured_mode';
    }

    _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async generateImage(prompt, requestedModel = null, useCache = false) {
        const isSecured = !this.config.isAnonymous;
        const modelToUse = requestedModel || this.imageModels[this.currentImageModelIndex];
        
        // Cache logic
        let hashKey = null;
        if (useCache && typeof dbManager !== 'undefined') {
            // Simple hash
            let cleanPrompt = prompt.substring(0, 150).replace(/[^a-zA-Z0-9]/g, '');
            hashKey = `img_${cleanPrompt}_${modelToUse}`;
            const cachedBase64 = await dbManager.getCachedImage(hashKey);
            if (cachedBase64) {
                console.log("[Cine-Tech] Image loaded from cache: " + hashKey);
                return cachedBase64;
            }
        }

        const seed = useCache ? 42 : Math.floor(Math.random()*1000000);
        const params = `?model=${modelToUse}&width=1024&height=1024&nologo=true&seed=${seed}`;
        
        let resultBase64 = null;

        if (isSecured) {
            let baseUrl = this.config.proxyUrl ? this.config.proxyUrl : this.endpoints.secured.image;
            baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
            const url = `${baseUrl}/${encodeURIComponent(prompt)}${params}`;
            try {
                const headers = {};
                if (this.config.sk_key) headers['Authorization'] = `Bearer ${this.config.sk_key}`;
                const response = await fetch(url, { method: 'GET', headers });
                if (response.status === 429) {
                    if (typeof document !== 'undefined') {
                        document.dispatchEvent(new CustomEvent('pollen-exhausted'));
                    }
                    console.warn("Out of pollen, falling back to free image endpoint");
                } else if (response.ok) {
                    const blob = await response.blob();
                    resultBase64 = await this._blobToBase64(blob);
                }
            } catch (e) {
                console.warn("Secured Render failed, falling back to Free endpoint.");
            }
        }
        
        if (!resultBase64) {
            const fallbackUrl = `${this.endpoints.free.image}/${encodeURIComponent(prompt)}${params}`;
            try {
                const response = await fetch(fallbackUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    resultBase64 = await this._blobToBase64(blob);
                }
            } catch(e) {
                console.warn("CORS or fetch error, returning string URL as fallback.", e);
                return fallbackUrl;
            }
        }
        
        if (useCache && hashKey && resultBase64 && typeof dbManager !== 'undefined') {
            await dbManager.setCachedImage(hashKey, resultBase64);
        }
        
        return resultBase64;
    }

    async generateText(prompt) {
        let isSecured = !this.config.isAnonymous;
        
        let modelsToTry = [
            ...this.textModels.slice(this.currentTextModelIndex),
            ...this.textModels.slice(0, this.currentTextModelIndex)
        ];

        for (const model of modelsToTry) {
            if (isSecured) {
                try {
                    let textBaseUrl = this.config.proxyUrl ? this.config.proxyUrl : this.endpoints.secured.text;
                    textBaseUrl = textBaseUrl.replace(/\/$/, ""); // Remove trailing slash
                    const headers = { "Content-Type": "application/json" };
                    if (this.config.sk_key) headers["Authorization"] = `Bearer ${this.config.sk_key}`;
                    const response = await fetch(textBaseUrl, {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
                    });
                    if (response.status === 429) {
                        if (typeof document !== 'undefined') {
                            document.dispatchEvent(new CustomEvent('pollen-exhausted'));
                        }
                        isSecured = false; // Fallback to free for remaining attempts
                        console.warn("Out of pollen, switching to free text models");
                    } else if (response.ok) {
                        const data = await response.json();
                        if (data.choices) {
                            this.currentTextModelIndex = this.textModels.indexOf(model);
                            return data.choices[0].message.content;
                        }
                    }
                } catch (e) { console.error("Secured Text Error:", e); }
            }

            if (!isSecured) {
                try {
                    const res = await fetch(this.endpoints.free.text, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: model })
                    });
                    if (res.ok) {
                        const text = await res.text();
                        if (text) {
                            this.currentTextModelIndex = this.textModels.indexOf(model);
                            return text;
                        }
                    }
                } catch (e) { console.error("Free Text Error on model " + model + ":", e); }
            }
        }
        return null;
    }
}
const pollinationsService = new PollinationsService();
