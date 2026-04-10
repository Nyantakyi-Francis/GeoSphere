const WORLD_NEWS_BASE_URL = 'https://api.worldnewsapi.com/search-news';

const FILTER_MAP = {
    general: 'general',
    tech: 'technology',
    sports: 'sports',
    business: 'business',
    health: 'health'
};

module.exports = async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        response.status(405).json({ error: 'Method not allowed.' });
        return;
    }

    const city = String(request.query.city || '').trim();
    if (!city) {
        response.status(400).json({ error: 'A city is required.' });
        return;
    }

    const apiKey = process.env.WORLD_NEWS_API_KEY;
    if (!apiKey) {
        response.status(503).json({ error: 'WORLD_NEWS_API_KEY is not configured.' });
        return;
    }

    const category = FILTER_MAP[String(request.query.filter || '').trim()] || FILTER_MAP.general;
    const query = category === FILTER_MAP.general ? city : `${city} ${category}`;

    const url = new URL(WORLD_NEWS_BASE_URL);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('text', query);
    url.searchParams.set('source-countries', 'us,gb');
    url.searchParams.set('language', 'en');
    url.searchParams.set('number', '8');

    try {
        const upstreamResponse = await fetch(url, {
            headers: {
                Accept: 'application/json'
            }
        });

        if (!upstreamResponse.ok) {
            response.status(upstreamResponse.status).json({
                error: `WorldNewsAPI returned ${upstreamResponse.status}.`
            });
            return;
        }

        const data = await upstreamResponse.json();
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        response.status(200).json(data);
    } catch (error) {
        response.status(502).json({
            error: 'Could not load news right now.',
            detail: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
