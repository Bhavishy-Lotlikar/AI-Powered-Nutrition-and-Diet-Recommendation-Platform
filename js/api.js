/**
 * NurtiMind API Client
 * Handles communication with the backend POST /analyze-image endpoint.
 * All AI logic stays on the backend — frontend only sends and renders.
 */

const NurtiMindAPI = (() => {
    const BASE_URL = window.location.origin;

    /**
     * Send a food image to the backend for AI analysis.
     *
     * @param {string} base64Image - Base64-encoded image (with or without data URI prefix)
     * @param {string} goal - Health goal: 'fat_loss' | 'muscle_gain' | 'maintenance'
     * @param {number} age - User age
     * @returns {Promise<object>} Analysis result
     */
    async function analyzeImage(base64Image, goal, age) {
        try {
            const response = await fetch(`${BASE_URL}/analyze-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image, goal, age: Number(age) }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server error (${response.status})`);
            }

            return data;
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your connection and try again.');
            }
            throw err;
        }
    }

    return { analyzeImage };
})();
