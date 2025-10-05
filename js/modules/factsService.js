// js/modules/factsService.js

/**
 * GeoSphere Facts & Trivia Service Module
 * Uses OpenTriviaDB API for real trivia questions
 * API Documentation: https://opentdb.com/api_config.php
 */

const TRIVIA_API_BASE_URL = 'https://opentdb.com/api.php';
const NUMBERS_API_URL = 'http://numbersapi.com';

// Fallback facts if API fails
const FALLBACK_FACTS = [
    "The Earth is the only planet known to support life.",
    "Mount Everest is the tallest mountain above sea level at 8,848 meters.",
    "The Amazon rainforest produces about 20% of the world's oxygen.",
    "The Sahara is the largest hot desert on Earth, covering 9 million square kilometers.",
    "The Pacific Ocean is the largest ocean on Earth, covering 165 million square kilometers.",
    "The Great Barrier Reef is the world's largest coral reef system.",
    "Antarctica is the coldest, driest, and windiest continent on Earth.",
    "The Nile River is often considered the longest river in the world at 6,650 km.",
    "Lake Baikal in Russia is the world's deepest lake at 1,642 meters.",
    "The Mariana Trench is the deepest part of the world's oceans at 11,034 meters."
];

/**
 * Fetch a trivia question from OpenTriviaDB
 * @param {string} city - City name (used for context in fallback)
 * @returns {Promise<Object>} Trivia question object
 */
export async function fetchTriviaQuestion(city) {
    try {
        // Fetch from OpenTriviaDB with multiple choice questions
        const response = await fetch(
            `${TRIVIA_API_BASE_URL}?amount=1&type=multiple&encode=url3986`
        );

        if (!response.ok) {
            throw new Error(`OpenTriviaDB API error: ${response.status}`);
        }

        const data = await response.json();

        // Check if we got valid results
        if (data.response_code !== 0 || !data.results || data.results.length === 0) {
            console.warn('No trivia results from API, using fallback');
            return getFallbackTrivia(city);
        }

        const trivia = data.results[0];

        // Decode URL-encoded strings
        const question = decodeURIComponent(trivia.question);
        const correctAnswer = decodeURIComponent(trivia.correct_answer);
        const incorrectAnswers = trivia.incorrect_answers.map(ans => decodeURIComponent(ans));
        const category = decodeURIComponent(trivia.category);
        const difficulty = trivia.difficulty;

        // Combine and shuffle all answers
        const allAnswers = [correctAnswer, ...incorrectAnswers];
        const shuffledAnswers = shuffleArray(allAnswers);

        return {
            question: question,
            answer: correctAnswer,
            allAnswers: shuffledAnswers,
            category: category,
            difficulty: difficulty,
            type: 'trivia',
            source: 'OpenTriviaDB'
        };

    } catch (error) {
        console.error('OpenTriviaDB fetch failed:', error);
        return getFallbackTrivia(city);
    }
}

/**
 * Get a random fact (alternative to trivia questions)
 * Uses Numbers API for interesting number facts
 * @returns {Promise<Object>} Random fact object
 */
export async function getRandomFact() {
    try {
        // Try Numbers API first
        const randomNum = Math.floor(Math.random() * 1000);
        const response = await fetch(`${NUMBERS_API_URL}/${randomNum}/trivia`);

        if (!response.ok) {
            throw new Error(`Numbers API error: ${response.status}`);
        }

        const factText = await response.text();

        return {
            question: 'Random Number Fact:',
            answer: factText,
            type: 'fact',
            source: 'Numbers API'
        };

    } catch (error) {
        console.error('Numbers API fetch failed, using fallback:', error);

        // Return random fallback fact
        const randomIndex = Math.floor(Math.random() * FALLBACK_FACTS.length);
        return {
            question: 'Fun Geography Fact:',
            answer: FALLBACK_FACTS[randomIndex],
            type: 'fact',
            source: 'Local Database'
        };
    }
}

/**
 * Fetch a geography-specific trivia question
 * @param {string} category - Category code (geography: 22)
 * @returns {Promise<Object>} Geography trivia
 */
export async function fetchGeographyTrivia() {
    try {
        // Category 22 is Geography in OpenTriviaDB
        const response = await fetch(
            `${TRIVIA_API_BASE_URL}?amount=1&category=22&type=multiple&encode=url3986`
        );

        if (!response.ok) {
            throw new Error(`Geography trivia API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.response_code !== 0 || !data.results || data.results.length === 0) {
            console.warn('No geography trivia available, using general trivia');
            return fetchTriviaQuestion();
        }

        const trivia = data.results[0];
        const question = decodeURIComponent(trivia.question);
        const correctAnswer = decodeURIComponent(trivia.correct_answer);
        const incorrectAnswers = trivia.incorrect_answers.map(ans => decodeURIComponent(ans));
        const allAnswers = shuffleArray([correctAnswer, ...incorrectAnswers]);

        return {
            question: question,
            answer: correctAnswer,
            allAnswers: allAnswers,
            category: 'Geography',
            difficulty: trivia.difficulty,
            type: 'trivia',
            source: 'OpenTriviaDB'
        };

    } catch (error) {
        console.error('Geography trivia fetch failed:', error);
        return fetchTriviaQuestion();
    }
}

/**
 * Check if the user's answer is correct
 * @param {Object} triviaData - Trivia question object
 * @param {string} userAnswer - User's answer
 * @returns {Object} Result object with correct boolean and correct answer
 */
export function checkAnswer(triviaData, userAnswer) {
    if (!triviaData || !triviaData.answer) {
        return { correct: false, correctAnswer: 'Unknown' };
    }

    const isCorrect = userAnswer.trim().toLowerCase() === triviaData.answer.trim().toLowerCase();

    return {
        correct: isCorrect,
        correctAnswer: triviaData.answer
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get fallback trivia when API fails
 * @param {string} city - City name for context
 * @returns {Object} Fallback trivia object
 */
function getFallbackTrivia(city) {
    const randomIndex = Math.floor(Math.random() * FALLBACK_FACTS.length);

    return {
        question: `Fun fact about ${city || 'our planet'}:`,
        answer: FALLBACK_FACTS[randomIndex],
        type: 'fact',
        category: 'Geography',
        difficulty: 'easy',
        source: 'Local Database'
    };
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Decode HTML entities (backup for URL decoding issues)
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHTML(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}