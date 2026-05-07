// Cloudflare Worker Script cho Game Cine-Tech
// Mã nguồn này sử dụng cách an toàn nhất: Đọc API Key từ "Variables and Secrets" của Cloudflare.
// Bạn đã cấu hình biến Secret tên là POLLINATIONS_API_KEY trong Settings.

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        let targetPath = '';
        
        // Đọc Key từ cấu hình Secrets thay vì viết cứng vào code
        // Đảm bảo trong Settings > Variables and Secrets bạn đã đặt tên là POLLINATIONS_API_KEY
        const SK_KEY = env.POLLINATIONS_API_KEY;

        if (!SK_KEY) {
            return new Response(JSON.stringify({ error: "Chưa cấu hình Secret POLLINATIONS_API_KEY trong Cloudflare Settings." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Xử lý CORS để trình duyệt không block request
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        // Với image (GET request)
        if (request.method === 'GET') {
            targetPath = `/image${url.pathname}${url.search}`;
        } 
        // Với text (POST request)
        else if (request.method === 'POST') {
            targetPath = `/v1/chat/completions${url.search}`;
        }

        const targetUrl = `https://gen.pollinations.ai${targetPath}`;
        
        const newHeaders = new Headers(request.headers);
        newHeaders.set('Authorization', `Bearer ${SK_KEY}`);
        newHeaders.delete('Host'); 
        
        const init = {
            method: request.method,
            headers: newHeaders,
        };

        if (request.method === 'POST' && request.body) {
            init.body = request.body;
        }

        try {
            const response = await fetch(targetUrl, init);

            const newResponse = new Response(response.body, response);
            newResponse.headers.set('Access-Control-Allow-Origin', '*');
            
            return newResponse;
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};
