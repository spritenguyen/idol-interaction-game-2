class PollinationsService {
    constructor() {
        this.config = { sk_key: null, isAnonymous: true };
        this.currentTextModel = 'openai';
        this.currentImageModel = 'flux';
        this.currentAudioModel = 'qwen-tts';
        
        this.endpoints = {
            secured: { image: 'https://gen.pollinations.ai/image', text: 'https://gen.pollinations.ai/v1/chat/completions' },
            free: { image: 'https://image.pollinations.ai/prompt', text: 'https://text.pollinations.ai/' }
        };
    }

    updateCredential(inputString) {
        inputString = (inputString || '').trim();
        if (!inputString) {
            this.config.sk_key = null;
            this.config.isAnonymous = true;
            return 'free_mode';
        }
        this.config.sk_key = inputString;
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

    async generateImage(prompt) {
        const isSecured = !this.config.isAnonymous;
        const params = `?model=${this.currentImageModel}&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random()*1000000)}`;
        
        if (isSecured) {
            const url = `${this.endpoints.secured.image}/${encodeURIComponent(prompt)}${params}`;
            try {
                const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${this.config.sk_key}` } });
                if (!response.ok) throw new Error("Secured API Error");
                const blob = await response.blob();
                return await this._blobToBase64(blob); 
            } catch (e) {
                console.warn("Secured Render failed, falling back to Free endpoint.");
            }
        }
        return `${this.endpoints.free.image}/${encodeURIComponent(prompt)}${params}`;
    }

    async generateText(prompt) {
        const isSecured = !this.config.isAnonymous;
        if (isSecured) {
            try {
                const response = await fetch(this.endpoints.secured.text, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.config.sk_key}` },
                    body: JSON.stringify({ model: this.currentTextModel, messages: [{ role: "user", content: prompt }] })
                });
                const data = await response.json();
                return data.choices ? data.choices[0].message.content : null;
            } catch (e) { console.error("Secured Text Error:", e); }
        }

        try {
            const res = await fetch(this.endpoints.free.text, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: this.currentTextModel })
            });
            return await res.text();
        } catch (e) { return null; }
    }
}
const pollinationsService = new PollinationsService();
