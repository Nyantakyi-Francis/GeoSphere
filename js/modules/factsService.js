const TRIVIA_API_BASE_URL = 'https://opentdb.com/api.php';
const NUMBERS_API_URL = 'https://numbersapi.com';

const FALLBACK_FACTS = [
    'The Earth is the only planet currently known to support life.',
    'Mount Everest rises 8,848 meters above sea level.',
    'The Sahara is the largest hot desert on Earth.',
    'The Pacific Ocean is the largest ocean on the planet.',
    'Antarctica is the coldest, driest, and windiest continent.',
    'Lake Baikal in Russia is the deepest lake in the world.'
];

export async function fetchTriviaQuestion(city) {
    try {
        const response = await fetch(
            `${TRIVIA_API_BASE_URL}?amount=1&type=multiple&encode=url3986`
        );

        if (!response.ok) {
            throw new Error(`OpenTriviaDB returned ${response.status}`);
        }

        const data = await response.json();
        if (data.response_code !== 0 || !Array.isArray(data.results) || data.results.length === 0) {
            return getFallbackTrivia(city);
        }

        const trivia = data.results[0];
        const correctAnswer = decodeText(trivia.correct_answer);
        const incorrectAnswers = trivia.incorrect_answers.map(answer => decodeText(answer));

        return {
            question: decodeText(trivia.question),
            answer: correctAnswer,
            allAnswers: shuffleArray([correctAnswer, ...incorrectAnswers]),
            category: decodeText(trivia.category),
            difficulty: formatDifficulty(trivia.difficulty),
            type: 'trivia',
            source: 'OpenTriviaDB'
        };
    } catch (error) {
        console.error('Trivia loading failed:', error);
        return getFallbackTrivia(city);
    }
}

export async function getRandomFact() {
    try {
        const randomNumber = Math.floor(Math.random() * 1000);
        const response = await fetch(`${NUMBERS_API_URL}/${randomNumber}/trivia`);

        if (!response.ok) {
            throw new Error(`Numbers API returned ${response.status}`);
        }

        return {
            question: 'Random number fact',
            answer: await response.text(),
            type: 'fact',
            source: 'Numbers API'
        };
    } catch (error) {
        console.error('Number fact loading failed:', error);
        return {
            question: 'Fun geography fact',
            answer: FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)],
            type: 'fact',
            source: 'Local fallback'
        };
    }
}

export async function fetchGeographyTrivia(city) {
    try {
        const response = await fetch(
            `${TRIVIA_API_BASE_URL}?amount=1&category=22&type=multiple&encode=url3986`
        );

        if (!response.ok) {
            throw new Error(`OpenTriviaDB returned ${response.status}`);
        }

        const data = await response.json();
        if (data.response_code !== 0 || !Array.isArray(data.results) || data.results.length === 0) {
            return fetchTriviaQuestion(city);
        }

        const trivia = data.results[0];
        const correctAnswer = decodeText(trivia.correct_answer);
        const incorrectAnswers = trivia.incorrect_answers.map(answer => decodeText(answer));

        return {
            question: decodeText(trivia.question),
            answer: correctAnswer,
            allAnswers: shuffleArray([correctAnswer, ...incorrectAnswers]),
            category: 'Geography',
            difficulty: formatDifficulty(trivia.difficulty),
            type: 'trivia',
            source: 'OpenTriviaDB'
        };
    } catch (error) {
        console.error('Geography trivia loading failed:', error);
        return fetchTriviaQuestion(city);
    }
}

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

function getFallbackTrivia(city) {
    return {
        question: `Quick fact about ${city || 'the world'}`,
        answer: FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)],
        type: 'fact',
        category: 'Geography',
        difficulty: 'Easy',
        source: 'Local fallback'
    };
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
}

function decodeText(text) {
    return decodeHtmlEntities(decodeURIComponent(text || ''));
}

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function formatDifficulty(value) {
    if (!value) {
        return '';
    }

    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
