const NEWS_API_PROXY_URL = '/api/news';

const FILTER_MAP = {
    general: 'general',
    tech: 'technology',
    sports: 'sports',
    business: 'business',
    health: 'health'
};

export async function fetchNews(city, filter) {
    if (!city) {
        return [];
    }

    const url = new URL(NEWS_API_PROXY_URL, window.location.origin);
    url.searchParams.set('city', city);
    url.searchParams.set('filter', filter || FILTER_MAP.general);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`News proxy returned ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.news)
        ? data.news.map(article => mapArticle(article)).filter(Boolean)
        : [];
}

function mapArticle(article) {
    if (!article?.title) {
        return null;
    }

    return {
        title: article.title.trim(),
        description: summarizeText(article.text || article.summary || article.snippet),
        url: sanitizeUrl(article.url),
        imageUrl: sanitizeUrl(article.image),
        author: article.author || '',
        source: getSourceLabel(article.source),
        publishedAt: article.publish_date || article.publishedAt || null
    };
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
