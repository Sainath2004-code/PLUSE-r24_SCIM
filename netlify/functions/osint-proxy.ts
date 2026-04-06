export const handler = async (event: any) => {
    const rssUrl = event.queryStringParameters?.rss_url;
    
    if (!rssUrl) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Missing rss_url parameter" })
        };
    }

    try {
        const apiKey = process.env.RSS2JSON_API_KEY ? `&api_key=${process.env.RSS2JSON_API_KEY}` : '';
        const fetchUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}${apiKey}`;
        
        const response = await fetch(fetchUrl);
        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(data)
        };
    } catch (err: any) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: err.message || "Proxy fetch failed" })
        };
    }
};
