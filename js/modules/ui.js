// js/modules/ui.js

/**
 * GeoSphere UI Module
 * Handles all DOM rendering and UI updates
 */

// ============================================
// NEWS RENDERING
// ============================================

/**
 * Render news cards with animations
 * @param {Array} articles - Array of news articles
 */
export function renderNewsCards(articles) {
    const container = document.getElementById('news');
    if (!container) return;

    container.innerHTML = '';

    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="p-4 bg-white rounded shadow text-center">
                <p class="text-gray-500">No news available for this location.</p>
                <p class="text-gray-400 text-sm mt-2">Try searching for a different city.</p>
            </div>
        `;
        return;
    }

    articles.forEach((article, index) => {
        const card = document.createElement('div');
        card.className = 'news-card news-card-squared';
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            ${article.imageUrl ? `
                <img src="${article.imageUrl}" 
                     alt="${escapeHtml(article.title)}" 
                     class="w-full h-64 object-contain bg-gray-50 mb-2 rounded"
                     onerror="this.src='https://picsum.photos/400/400?random=${index}'"
                />
            ` : ''}
            <div class="p-3">
                <h3 class="text-lg font-bold mb-2">${escapeHtml(article.title)}</h3>
                ${article.source ? `
                    <p class="text-gray-500 text-sm mb-2">
                        ${escapeHtml(article.source)}
                        ${article.author ? ` • ${escapeHtml(article.author)}` : ''}
                    </p>
                ` : ''}
                <p class="text-gray-700 mb-3 line-clamp-3">${escapeHtml(article.description || 'No description available')}</p>
                <a href="${escapeHtml(article.url)}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="text-blue-600 hover:underline font-semibold">
                    Read more →
                </a>
            </div>
        `;

        container.appendChild(card);
    });

    console.log(`Rendered ${articles.length} news articles`);
}

// ============================================
// TRIVIA RENDERING
// ============================================

/**
 * Render trivia question with multiple choice answers
 * @param {Object} triviaData - Trivia data object
 */
export function renderTrivia(triviaData) {
    const container = document.getElementById('fact');
    if (!container) return;

    if (!triviaData) {
        container.innerHTML = '<p class="text-gray-500">No trivia available. Click the button to get a new question!</p>';
        return;
    }

    // If it's a simple fact (no multiple choice)
    if (triviaData.type === 'fact' || !triviaData.allAnswers) {
        container.innerHTML = `
            <div class="bg-white rounded shadow p-4">
                <h3 class="font-bold text-lg mb-2 text-teal-600">${escapeHtml(triviaData.question)}</h3>
                <p class="text-gray-700 mb-3">${escapeHtml(triviaData.answer)}</p>
                ${triviaData.source ? `
                    <p class="text-gray-400 text-sm">Source: ${escapeHtml(triviaData.source)}</p>
                ` : ''}
            </div>
        `;
        return;
    }

    // Render multiple choice trivia question
    container.innerHTML = `
        <div class="bg-white rounded shadow p-4">
            <div class="mb-4">
                ${triviaData.category ? `
                    <span class="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">
                        ${escapeHtml(triviaData.category)}
                    </span>
                ` : ''}
                ${triviaData.difficulty ? `
                    <span class="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded ml-2">
                        ${escapeHtml(triviaData.difficulty)}
                    </span>
                ` : ''}
            </div>
            
            <h3 class="font-bold text-lg mb-4 text-gray-800">${escapeHtml(triviaData.question)}</h3>
            
            <div id="triviaAnswers" class="space-y-2 mb-4">
                ${triviaData.allAnswers.map((answer, index) => `
                    <button class="answer-btn w-full" data-answer="${escapeHtml(answer)}">
                        ${String.fromCharCode(65 + index)}. ${escapeHtml(answer)}
                    </button>
                `).join('')}
            </div>
            
            <div id="triviaResult" class="hidden mt-4 p-3 rounded"></div>
            
            ${triviaData.source ? `
                <p class="text-gray-400 text-sm mt-3">Source: ${escapeHtml(triviaData.source)}</p>
            ` : ''}
        </div>
    `;

    // Add event listeners to answer buttons
    const answerButtons = container.querySelectorAll('.answer-btn');
    answerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleTriviaAnswer(e.target, triviaData);
        });
    });

    console.log('Rendered trivia question:', triviaData.question);
}

/**
 * Handle trivia answer selection
 * @param {HTMLElement} button - Clicked button
 * @param {Object} triviaData - Trivia data
 */
function handleTriviaAnswer(button, triviaData) {
    const userAnswer = button.dataset.answer;
    const isCorrect = userAnswer === triviaData.answer;
    const resultDiv = document.getElementById('triviaResult');
    const allButtons = document.querySelectorAll('.answer-btn');

    // Disable all buttons
    allButtons.forEach(btn => {
        btn.disabled = true;

        // Highlight correct and incorrect answers
        if (btn.dataset.answer === triviaData.answer) {
            btn.classList.add('correct');
        } else if (btn.dataset.answer === userAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Show result
    if (resultDiv) {
        resultDiv.classList.remove('hidden');
        if (isCorrect) {
            resultDiv.className = 'mt-4 p-3 rounded bg-green-100 text-green-800';
            resultDiv.innerHTML = `
                <p class="font-bold">✓ Correct!</p>
                <p class="text-sm">Great job! You got it right.</p>
            `;
        } else {
            resultDiv.className = 'mt-4 p-3 rounded bg-red-100 text-red-800';
            resultDiv.innerHTML = `
                <p class="font-bold">✗ Incorrect</p>
                <p class="text-sm">The correct answer is: <strong>${escapeHtml(triviaData.answer)}</strong></p>
            `;
        }
    }

    console.log(`User answered: ${userAnswer}, Correct: ${isCorrect}`);
}

// ============================================
// FAVORITES RENDERING
// ============================================

/**
 * Render favorites list
 * @param {Array} favorites - Array of favorite locations
 */
export function renderFavorites(favorites) {
    const container = document.getElementById('favoritesList');

    // If container doesn't exist, just log it
    if (!container) {
        console.log(`Loaded ${favorites.length} favorites (no UI container found)`);
        return;
    }

    container.innerHTML = '';

    if (!favorites || favorites.length === 0) {
        container.innerHTML = `
            <div class="p-4 bg-gray-50 rounded text-center">
                <p class="text-gray-500">No favorites yet</p>
                <p class="text-gray-400 text-sm mt-1">Add locations to quickly access them later!</p>
            </div>
        `;
        return;
    }

    favorites.forEach((fav, index) => {
        const favCard = document.createElement('div');
        favCard.className = 'p-3 bg-white rounded shadow mb-2 cursor-pointer hover:bg-gray-100 transition';
        favCard.style.animationDelay = `${index * 0.05}s`;

        favCard.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-800">${escapeHtml(fav.city)}</p>
                    ${fav.region ? `<p class="text-sm text-gray-500">${escapeHtml(fav.region)}</p>` : ''}
                    ${fav.addedAt ? `
                        <p class="text-xs text-gray-400 mt-1">
                            Added: ${formatDate(fav.addedAt)}
                        </p>
                    ` : ''}
                </div>
                <button class="remove-fav-btn text-red-500 hover:text-red-700 font-bold" 
                        data-lat="${fav.lat}" 
                        data-lng="${fav.lng}">
                    ✕
                </button>
            </div>
        `;

        // Click to select favorite
        favCard.addEventListener('click', (e) => {
            // Don't trigger if clicking remove button
            if (e.target.classList.contains('remove-fav-btn')) return;

            const event = new CustomEvent('favoriteSelected', {
                detail: fav
            });
            document.dispatchEvent(event);
        });

        container.appendChild(favCard);
    });

    console.log(`Rendered ${favorites.length} favorites in UI`);
}

// ============================================
// TAB MANAGEMENT
// ============================================

/**
 * Set active tab and show corresponding content
 * @param {string} tabName - 'news' or 'trivia'
 */
export function setActiveTab(tabName) {
    // Update tab buttons
    const allTabButtons = document.querySelectorAll('.tab-btn');
    allTabButtons.forEach(btn => {
        btn.classList.remove('active-tab', 'border-teal-600', 'text-teal-600');
        btn.classList.add('text-gray-500');
    });

    const activeBtn = document.getElementById(tabName === 'news' ? 'tabNews' : 'tabFacts');
    if (activeBtn) {
        activeBtn.classList.add('active-tab', 'border-teal-600', 'text-teal-600');
        activeBtn.classList.remove('text-gray-500');
    }

    // Show/hide sections
    const newsSection = document.getElementById('newsSection');
    const factsSection = document.getElementById('factsSection');

    if (newsSection) {
        newsSection.classList.toggle('hidden', tabName !== 'news');
    }

    if (factsSection) {
        factsSection.classList.toggle('hidden', tabName !== 'trivia');
    }

    console.log(`Switched to ${tabName} tab`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    } catch (e) {
        return '';
    }
}

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container element
 */
export function showLoading(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="flex justify-center items-center p-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
    `;
}

/**
 * Show error message
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 */
export function showError(container, message) {
    if (!container) return;

    container.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded">
            <p class="text-red-800 font-semibold">Error</p>
            <p class="text-red-600 text-sm">${escapeHtml(message)}</p>
        </div>
    `;
}