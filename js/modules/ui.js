let appMessageTimerId = 0;

export function renderNewsLoading() {
    const container = document.getElementById('news');
    if (!container) {
        return;
    }

    container.innerHTML = Array.from({ length: 3 }, () => `
        <article class="news-card loading-card" aria-hidden="true">
            <div class="loading-block loading-media"></div>
            <div class="news-card-body">
                <div class="loading-line short"></div>
                <div class="loading-line"></div>
                <div class="loading-line"></div>
                <div class="loading-line tiny"></div>
            </div>
        </article>
    `).join('');
}

export function renderNewsCards(articles, city) {
    const container = document.getElementById('news');
    if (!container) {
        return;
    }

    if (!Array.isArray(articles) || articles.length === 0) {
        container.innerHTML = `
            <div class="content-placeholder">
                <strong>No current headlines found.</strong>
                <p>No headlines were available for ${escapeHtml(city || 'this location')} right now. Try another place or check back later.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = articles.map(article => {
        const articleUrl = sanitizeUrl(article.url);
        const imageUrl = sanitizeUrl(article.imageUrl);
        const publishedLabel = formatArticleDate(article.publishedAt);

        return `
            <article class="news-card">
                ${imageUrl
                    ? `
                        <div class="news-card-media">
                            <img src="${imageUrl}" alt="${escapeHtml(article.title)}" loading="lazy">
                        </div>
                    `
                    : `
                        <div class="news-card-media news-card-media-placeholder">
                            <span>No preview available</span>
                        </div>
                    `}
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="pill">${escapeHtml(article.source || 'News feed')}</span>
                        ${article.author ? `<span class="pill pill-muted">${escapeHtml(article.author)}</span>` : ''}
                    </div>
                    <h3>${escapeHtml(article.title)}</h3>
                    <p>${escapeHtml(article.description || 'No summary available.')}</p>
                    <div class="news-card-footer">
                        ${articleUrl
                            ? `
                                <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="link-arrow">
                                    Open article
                                </a>
                            `
                            : '<span class="link-muted">Preview only</span>'}
                        ${publishedLabel ? `<span class="article-date">${escapeHtml(publishedLabel)}</span>` : ''}
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

export function renderTriviaLoading(message = 'Loading trivia...') {
    const container = document.getElementById('fact');
    if (!container) {
        return;
    }

    container.innerHTML = `
        <article class="trivia-card">
            <p class="eyebrow">Location trivia</p>
            <p class="trivia-question">${escapeHtml(message)}</p>
            <div class="loading-stack" aria-hidden="true">
                <div class="loading-line"></div>
                <div class="loading-line"></div>
                <div class="loading-line short"></div>
            </div>
        </article>
    `;
}

export function renderTrivia(triviaData) {
    const container = document.getElementById('fact');
    if (!container) {
        return;
    }

    if (!triviaData) {
        container.innerHTML = `
            <div class="content-placeholder">
                <strong>No trivia available right now.</strong>
                <p>Try another question or switch to a different place.</p>
            </div>
        `;
        return;
    }

    if (triviaData.type === 'fact' || !Array.isArray(triviaData.allAnswers)) {
        container.innerHTML = `
            <article class="trivia-card">
                <p class="eyebrow">Location fact</p>
                <h3 class="trivia-question">${escapeHtml(triviaData.question)}</h3>
                <p class="trivia-copy">${escapeHtml(triviaData.answer)}</p>
                ${triviaData.source ? `<p class="trivia-source">Source: ${escapeHtml(triviaData.source)}</p>` : ''}
            </article>
        `;
        return;
    }

    container.innerHTML = `
        <article class="trivia-card">
            <div class="trivia-badges">
                ${triviaData.category ? `<span class="pill">${escapeHtml(triviaData.category)}</span>` : ''}
                ${triviaData.difficulty ? `<span class="pill pill-muted">${escapeHtml(triviaData.difficulty)}</span>` : ''}
            </div>
            <h3 class="trivia-question">${escapeHtml(triviaData.question)}</h3>
            <div class="trivia-answers">
                ${triviaData.allAnswers.map((answer, index) => `
                    <button type="button" class="answer-btn" data-answer="${escapeHtml(answer)}">
                        <span class="answer-label">${String.fromCharCode(65 + index)}</span>
                        <span>${escapeHtml(answer)}</span>
                    </button>
                `).join('')}
            </div>
            <div class="trivia-result hidden"></div>
            ${triviaData.source ? `<p class="trivia-source">Source: ${escapeHtml(triviaData.source)}</p>` : ''}
        </article>
    `;

    container.querySelectorAll('.answer-btn').forEach(button => {
        button.addEventListener('click', () => {
            handleTriviaAnswer(button, triviaData, container);
        });
    });
}

function handleTriviaAnswer(clickedButton, triviaData, scope) {
    const userAnswer = clickedButton.dataset.answer;
    const isCorrect = userAnswer === triviaData.answer;
    const answerButtons = scope.querySelectorAll('.answer-btn');
    const resultPanel = scope.querySelector('.trivia-result');

    answerButtons.forEach(button => {
        button.disabled = true;

        if (button.dataset.answer === triviaData.answer) {
            button.classList.add('correct');
        } else if (button.dataset.answer === userAnswer) {
            button.classList.add('incorrect');
        }
    });

    if (!resultPanel) {
        return;
    }

    resultPanel.classList.remove('hidden');
    resultPanel.classList.add(isCorrect ? 'correct' : 'incorrect');
    resultPanel.innerHTML = isCorrect
        ? `
            <strong>Correct.</strong>
            <p>Nice work. GeoSphere marked the right answer immediately so the feedback feels fast.</p>
        `
        : `
            <strong>Not quite.</strong>
            <p>The correct answer was ${escapeHtml(triviaData.answer)}.</p>
        `;
}

export function renderFavorites(favorites) {
    const container = document.getElementById('favoritesList');
    if (!container) {
        return;
    }

    if (!Array.isArray(favorites) || favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No saved places yet. Save the current place to keep it here.
            </div>
        `;
        return;
    }

    container.innerHTML = favorites.map((favorite, index) => `
        <article class="favorite-card">
            <div class="favorite-card-head">
                <button type="button" class="favorite-select-btn" data-index="${index}">
                    <span class="favorite-city">${escapeHtml(favorite.city)}</span>
                    ${favorite.region ? `<span class="favorite-region">${escapeHtml(favorite.region)}</span>` : ''}
                    ${favorite.addedAt ? `<span class="favorite-time">Saved ${escapeHtml(formatRelativeDate(favorite.addedAt))}</span>` : ''}
                </button>
                <button
                    type="button"
                    class="favorite-remove-btn"
                    data-index="${index}"
                    aria-label="Remove ${escapeHtml(favorite.city)} from favorites"
                >
                    X
                </button>
            </div>
        </article>
    `).join('');

    container.querySelectorAll('.favorite-select-btn').forEach(button => {
        button.addEventListener('click', () => {
            const favorite = favorites[Number(button.dataset.index)];
            document.dispatchEvent(new CustomEvent('favoriteSelected', {
                detail: favorite
            }));
        });
    });

    container.querySelectorAll('.favorite-remove-btn').forEach(button => {
        button.addEventListener('click', () => {
            const favorite = favorites[Number(button.dataset.index)];
            document.dispatchEvent(new CustomEvent('favoriteRemoved', {
                detail: {
                    city: favorite.city,
                    lat: favorite.lat,
                    lng: favorite.lng
                }
            }));
        });
    });
}

export function renderSearchHistory(history) {
    const container = document.getElementById('searchHistoryList');
    if (!container) {
        return;
    }

    if (!Array.isArray(history) || history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No recent searches yet. Your latest place searches will appear here for one-click access.
            </div>
        `;
        return;
    }

    container.innerHTML = history.map((term, index) => `
        <button type="button" class="history-chip" data-index="${index}">
            <span class="history-city">${escapeHtml(term)}</span>
            <span class="history-meta">Tap to reload this location</span>
        </button>
    `).join('');

    container.querySelectorAll('.history-chip').forEach(button => {
        button.addEventListener('click', () => {
            const term = history[Number(button.dataset.index)];
            document.dispatchEvent(new CustomEvent('searchHistorySelected', {
                detail: term
            }));
        });
    });
}

export function setActiveTab(tabName) {
    const tabNews = document.getElementById('tabNews');
    const tabFacts = document.getElementById('tabFacts');
    const newsSection = document.getElementById('newsSection');
    const factsSection = document.getElementById('factsSection');

    if (!tabNews || !tabFacts || !newsSection || !factsSection) {
        return;
    }

    const showingNews = tabName === 'news';

    tabNews.classList.toggle('active-tab', showingNews);
    tabFacts.classList.toggle('active-tab', !showingNews);
    tabNews.setAttribute('aria-pressed', String(showingNews));
    tabFacts.setAttribute('aria-pressed', String(!showingNews));

    newsSection.classList.toggle('hidden', !showingNews);
    factsSection.classList.toggle('hidden', showingNews);
}

export function showAppMessage(message, variant = 'info', options = {}) {
    const banner = document.getElementById('appMessage');
    if (!banner) {
        return;
    }

    const duration = options.duration ?? 4500;

    banner.innerHTML = `<p>${escapeHtml(message)}</p>`;
    banner.dataset.variant = variant;
    banner.classList.remove('hidden');

    window.clearTimeout(appMessageTimerId);
    if (duration > 0) {
        appMessageTimerId = window.setTimeout(() => {
            banner.classList.add('hidden');
        }, duration);
    }
}

export function clearAppMessage() {
    const banner = document.getElementById('appMessage');
    if (!banner) {
        return;
    }

    window.clearTimeout(appMessageTimerId);
    banner.classList.add('hidden');
    banner.innerHTML = '';
}

export function showError(container, message, title = 'Something went wrong.') {
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="content-placeholder content-error">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

export function renderMapFallback(options = {}) {
    const container = document.getElementById('mapFallback');
    const map = document.getElementById('map');

    if (!container || !map) {
        return;
    }

    container.innerHTML = `
        <div class="map-fallback-card">
            <h3>${escapeHtml(options.title || 'Map unavailable')}</h3>
            <p>${escapeHtml(options.message || 'The map could not be shown right now.')}</p>
            ${options.actionLabel
                ? `<button type="button" class="button button-secondary button-small" data-map-action>${escapeHtml(options.actionLabel)}</button>`
                : ''}
        </div>
    `;

    container.classList.remove('hidden');
    map.classList.add('is-unavailable');

    const actionButton = container.querySelector('[data-map-action]');
    if (actionButton && typeof options.onAction === 'function') {
        actionButton.addEventListener('click', options.onAction);
    }
}

export function clearMapFallback() {
    const container = document.getElementById('mapFallback');
    const map = document.getElementById('map');

    if (!container || !map) {
        return;
    }

    container.classList.add('hidden');
    container.innerHTML = '';
    map.classList.remove('is-unavailable');
}

export function setFavoriteButtonLabel(isSaved, hasLocation = true) {
    const button = document.getElementById('addFavoriteBtn');
    if (!button) {
        return;
    }

    button.disabled = !hasLocation;
    button.textContent = isSaved ? 'Remove from favorites' : 'Save current place';
    button.classList.toggle('is-saved', isSaved);
}

function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) {
        return 'just now';
    }

    if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }

    return date.toLocaleDateString();
}

function formatArticleDate(dateString) {
    if (!dateString) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en', {
            month: 'short',
            day: 'numeric'
        }).format(new Date(dateString));
    } catch {
        return '';
    }
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

function escapeHtml(value) {
    if (!value) {
        return '';
    }

    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}
