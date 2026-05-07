async function testApi() {
    const prompt = "reply me with 'success'";
    const model = 'openai';
    
    console.log("Testing text.pollinations.ai...");
    try {
        const res = await fetch("https://text.pollinations.ai/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: model })
        });
        const text = await res.text();
        console.log("Free API Output: ", text.substring(0, 50));
    } catch(e) {
        console.error("Free API Error: ", e);
    }
    
    console.log("Testing pollinations-proxy...");
    try {
        const res = await fetch("https://pollinations-proxy.spritenguyen.workers.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
        });
        const data = await res.json();
        console.log("Proxy API Output: ", data.choices?.[0]?.message?.content?.substring(0,50));
    } catch(e) {
        console.error("Proxy API Error: ", e);
    }
}
testApi();
