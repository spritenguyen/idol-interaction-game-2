class PollinationsService {
    constructor() {
        this.proxyUrl = 'https://pollinations-proxy.spritenguyen.workers.dev';
        this.imageModels = ['flux', 'zimage', 'qwen-image', 'gptimage-large'];
        this.currentImageModelIndex = 0;
        
        this.endpoints = {
            secured: 'https://gen.pollinations.ai/image',
            free: 'https://image.pollinations.ai/prompt'
        };
        
        // Expose exhaustion state globally so ApiManager and this share state, or just manage locally
        this.pollenExhausted = false;
    }

    setImageModel(modelName) {
        let idx = this.imageModels.indexOf(modelName);
        this.currentImageModelIndex = idx !== -1 ? idx : 0;
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
        if (typeof gameApp !== 'undefined') gameApp.setApiState("Rendering...", "is-active");

        const modelToUse = requestedModel || this.imageModels[this.currentImageModelIndex];
        
        // Cache logic
        let hashKey = null;
        if (useCache && typeof dbManager !== 'undefined') {
            let cleanPrompt = prompt.substring(0, 150).replace(/[^a-zA-Z0-9]/g, '');
            hashKey = `img_${cleanPrompt}_${modelToUse}`;
            const cachedBase64 = await dbManager.getCachedImage(hashKey);
            if (cachedBase64) {
                console.log("[Cine-Tech] Image loaded from cache: " + hashKey);
                if (typeof gameApp !== 'undefined') gameApp.setApiState("Idle");
                return cachedBase64;
            }
        }

        const seed = useCache ? 42 : Math.floor(Math.random()*1000000);
        const params = `?model=${modelToUse}&width=1024&height=1024&nologo=true&seed=${seed}`;
        
        let resultBase64 = null;

        // Sync exhausted state with API Manager if available
        if (typeof apiManager !== 'undefined') {
            this.pollenExhausted = apiManager.pollenExhausted;
        }

        // Try Proxy
        if (!this.pollenExhausted) {
            let baseUrl = this.proxyUrl; // Worker acts as gen endpoint
            const url = `${baseUrl}/${encodeURIComponent(prompt)}${params}`;
            try {
                const response = await fetch(url, { method: 'GET' });
                if (response.status === 429 || response.status === 402) {
                    console.warn("[Pollinations] Out of pollen for images, falling back to free image endpoint");
                    this.pollenExhausted = true;
                    if (typeof apiManager !== 'undefined') apiManager.pollenExhausted = true;
                    if (typeof gameApp !== 'undefined') {
                        gameApp.showToast("Proxy cạn phấn hoa, tự động chuyển về điểm phát miễn phí!", "error");
                        gameApp.updateApiStatusWidget();
                    }
                } else if (response.ok) {
                    const blob = await response.blob();
                    resultBase64 = await this._blobToBase64(blob);
                }
            } catch (e) {
                console.warn("[Pollinations] Secured Render (Proxy) failed, falling back to Free endpoint.", e);
                this.pollenExhausted = true;
                if (typeof apiManager !== 'undefined') apiManager.pollenExhausted = true;
                if (typeof gameApp !== 'undefined') gameApp.updateApiStatusWidget();
            }
        }
        
        // Fallback Free
        if (!resultBase64) {
            const fallbackUrl = `${this.endpoints.free}/${encodeURIComponent(prompt)}${params}`;
            try {
                console.log("[Pollinations] Fetching image from free endpoint...");
                const response = await fetch(fallbackUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    resultBase64 = await this._blobToBase64(blob);
                } else if (response.status === 429) {
                     // If free is also limited, give it a shot later by resetting
                     this.pollenExhausted = false;
                     if (typeof apiManager !== 'undefined') apiManager.pollenExhausted = false;
                }
            } catch(e) {
                console.warn("[Pollinations] CORS or fetch error on free, returning string URL as fallback.", e);
                if (typeof gameApp !== 'undefined') {
                    gameApp.setApiState("Idle");
                }
                return fallbackUrl;
            }
        }
        
        if (useCache && hashKey && resultBase64 && typeof dbManager !== 'undefined') {
            await dbManager.setCachedImage(hashKey, resultBase64);
        }
        
        if (resultBase64) {
            if (typeof gameApp !== 'undefined') gameApp.setApiState("Idle");
            return resultBase64;
        }

        if (typeof gameApp !== 'undefined') {
            gameApp.setApiState("Failed", "is-error");
            setTimeout(() => gameApp.setApiState("Idle"), 3000);
        }
        return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent("Fail to fetch Image")}`;
    }
}
const pollinationsService = new PollinationsService();
