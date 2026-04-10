const NEWS_API_PROXY_URL = '/api/news';

const FILTER_MAP = {
    general: 'general',
    tech: 'technology',
    sports: 'sports',
    business: 'business',
    health: 'health'
};

const FALLBACK_NEWS = [
    {
        title: 'Design snapshot: how city discovery apps build trust',
        description: 'A strong local explorer balances speed, clarity, and context so users know what they are looking at right away.',
        author: 'GeoSphere Demo Feed',
        source: 'Portfolio Preview'
    },
    {
        title: 'Product idea: make saved places feel like a travel notebook',
        description: 'Favorites, recent searches, and session memory turn a simple map search into an experience that feels personal and reusable.',
        author: 'GeoSphere Demo Feed',
        source: 'Portfolio Preview'
    },
    {
        title: 'Frontend note: resilient UI beats a blank screen',
        description: 'Thoughtful empty states and fallback content show product maturity even when a third-party API is unavailable.',
        author: 'GeoSphere Demo Feed',
        source: 'Portfolio Preview'
    }
];

export async function fetchNews(city, filter) {
    if (!city) {
        return getFallbackNews('this location');
    }

    try {
        const url = new URL(NEWS_API_PROXY_URL, window.location.origin);
        url.searchParams.set('city', city);
        url.searchParams.set('filter', filter || FILTER_MAP.general);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`News proxy returned ${response.status}`);
        }

        const data = await response.json();
        const articles = Array.isArray(data.news)
            ? data.news.map((article, index) => mapArticle(article, index)).filter(Boolean)
            : [];

        return articles.length > 0 ? articles : getFallbackNews(city);
    } catch (error) {
        console.error('News loading failed:', error);
        return getFallbackNews(city);
    }
}

function mapArticle(article, index) {
    if (!article?.title) {
        return null;
    }

    return {
        title: article.title.trim(),
        description: summarizeText(article.text || article.summary || article.snippet),
        url: sanitizeUrl(article.url),
        imageUrl: sanitizeUrl(article.image) || getFallbackImage(index),
        author: article.author || '',
        source: getSourceLabel(article.source),
        publishedAt: article.publish_date || article.publishedAt || null
    };
}

function getFallbackNews(city) {
    return FALLBACK_NEWS.map((article, index) => ({
        ...article,
        title: article.title.replace('city', city),
        imageUrl: getFallbackImage(index),
        url: '',
        publishedAt: null
    }));
}

function summarizeText(text) {
    const cleanText = (text || '').replace(/\s+/g, ' ').trim();
    if (!cleanText) {
        return 'No summary was available for this story, so GeoSphere switched to a compact preview.';
    }

    if (cleanText.length <= 170) {
        return cleanText;
    }

    return `${cleanText.slice(0, 167).trim()}...`;
}

function getSourceLabel(source) {
    if (!source) {
        return 'World news feed';
    }

    if (typeof source === 'string') {
        return source;
    }

    return source.name || source.title || 'World news feed';
}

function getFallbackImage(index) {
    return `https://picsum.photos/seed/geosphere-${index + 1}/900/560`;
}

function sanitizeUrl(url) {
    if (!url) {
        return '';
    }

    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.toString() : '';
    } catch {
        return '';
    }
}
