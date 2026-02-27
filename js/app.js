/**
 * NurtiMind — Main Application
 * SPA with hash-based routing: #home, #camera, #results
 * State management, page rendering, event handling.
 */

const App = (() => {
    // Application state
    const state = {
        goal: null,
        age: null,
        capturedImage: null,
        result: null,
        error: null,
        loading: false,
    };

    const appEl = document.getElementById('app');

    // ==========================================
    //  Router
    // ==========================================

    function navigate(page) {
        window.location.hash = page;
    }

    function getPage() {
        const hash = window.location.hash.replace('#', '') || 'home';
        return hash;
    }

    function handleRoute() {
        // Stop camera if leaving camera page
        if (CameraManager.isActive()) {
            CameraManager.stop();
        }

        const page = getPage();
        switch (page) {
            case 'camera':
                renderCameraPage();
                break;
            case 'results':
                renderResultsPage();
                break;
            case 'home':
            default:
                renderHomePage();
                break;
        }
    }

    // ==========================================
    //  Home Page
    // ==========================================

    function renderHomePage() {
        appEl.innerHTML = `
      <div class="page home-page" id="home-page">
        <div class="logo-section">
          <div class="logo-icon">🧠</div>
          <div class="logo">NurtiMind</div>
          <div class="tagline">Scan Smart. Eat Smarter.</div>
        </div>

        <div class="goal-section">
          <label>Choose Your Goal</label>
          <div class="goal-pills" id="goal-pills">
            <button class="goal-pill ${state.goal === 'fat_loss' ? 'active' : ''}"
                    data-goal="fat_loss" id="goal-fat-loss">
              🔥 Fat Loss
            </button>
            <button class="goal-pill ${state.goal === 'muscle_gain' ? 'active' : ''}"
                    data-goal="muscle_gain" id="goal-muscle-gain">
              💪 Muscle Gain
            </button>
            <button class="goal-pill ${state.goal === 'maintenance' ? 'active' : ''}"
                    data-goal="maintenance" id="goal-maintenance">
              ⚖️ Maintenance
            </button>
          </div>
        </div>

        <div class="age-section">
          <label for="age-input">Your Age</label>
          <input type="number" id="age-input" class="age-input"
                 placeholder="25" min="1" max="120"
                 value="${state.age || ''}" inputmode="numeric">
        </div>

        <div class="cta-section">
          <button class="btn btn-primary" id="btn-capture"
                  ${!state.goal || !state.age ? 'disabled' : ''}>
            <span class="btn-icon">📸</span> Capture Food
          </button>
          <button class="btn btn-secondary" id="btn-upload"
                  ${!state.goal || !state.age ? 'disabled' : ''}>
            <span class="btn-icon">📂</span> Upload Image
          </button>
        </div>
      </div>
    `;

        bindHomeEvents();
    }

    function bindHomeEvents() {
        // Goal pills
        document.querySelectorAll('.goal-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                state.goal = pill.dataset.goal;
                document.querySelectorAll('.goal-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                updateCTAState();
            });
        });

        // Age input
        const ageInput = document.getElementById('age-input');
        ageInput.addEventListener('input', () => {
            const val = parseInt(ageInput.value, 10);
            state.age = (val >= 1 && val <= 120) ? val : null;
            updateCTAState();
        });

        // Capture button
        document.getElementById('btn-capture').addEventListener('click', () => {
            if (state.goal && state.age) {
                navigate('camera');
            }
        });

        // Upload button
        document.getElementById('btn-upload').addEventListener('click', async () => {
            if (!state.goal || !state.age) return;

            try {
                const imageData = await ImageUploader.selectImage();
                state.capturedImage = imageData;
                await analyzeAndShowResults();
            } catch (err) {
                if (err.message === '__cancelled__') return;
                showError(err.message);
            }
        });
    }

    function updateCTAState() {
        const enabled = state.goal && state.age;
        const captureBtn = document.getElementById('btn-capture');
        const uploadBtn = document.getElementById('btn-upload');
        if (captureBtn) captureBtn.disabled = !enabled;
        if (uploadBtn) uploadBtn.disabled = !enabled;
    }

    // ==========================================
    //  Camera Page
    // ==========================================

    function renderCameraPage() {
        state.capturedImage = null;

        appEl.innerHTML = `
      <div class="page camera-page" id="camera-page">
        <div class="camera-header">
          <h2>📸 Capture Food</h2>
          <button class="btn btn-ghost" id="btn-cancel"
                  style="width:auto; min-height:40px; padding:8px 16px; font-size:0.85rem;">
            ✕ Cancel
          </button>
        </div>

        <div class="camera-viewport" id="camera-viewport">
          <video id="camera-video" autoplay playsinline muted></video>
          <div class="camera-overlay">
            <div class="camera-frame"></div>
            <div class="camera-hint">Position food in frame</div>
          </div>
        </div>

        <div class="camera-controls">
          <button class="capture-btn" id="btn-take-photo" aria-label="Take photo"></button>
        </div>
      </div>
    `;

        bindCameraEvents();
        startCamera();
    }

    function renderCapturedPreview(imageData) {
        appEl.innerHTML = `
      <div class="page camera-page" id="camera-page">
        <div class="camera-header">
          <h2>📸 Preview</h2>
          <button class="btn btn-ghost" id="btn-cancel"
                  style="width:auto; min-height:40px; padding:8px 16px; font-size:0.85rem;">
            ✕ Cancel
          </button>
        </div>

        <div class="image-preview-container">
          <img src="${imageData}" alt="Captured food" id="preview-image">
          <button class="retake-badge" id="btn-retake">↻ Retake</button>
        </div>

        <div class="cta-section">
          <button class="btn btn-primary" id="btn-analyze">
            <span class="btn-icon">🧠</span> Analyze Food
          </button>
        </div>
      </div>
    `;

        // Cancel
        document.getElementById('btn-cancel').addEventListener('click', () => {
            navigate('home');
        });

        // Retake
        document.getElementById('btn-retake').addEventListener('click', () => {
            renderCameraPage();
        });

        // Analyze
        document.getElementById('btn-analyze').addEventListener('click', async () => {
            await analyzeAndShowResults();
        });
    }

    async function startCamera() {
        try {
            const video = document.getElementById('camera-video');
            await CameraManager.start(video);
        } catch (err) {
            const viewport = document.getElementById('camera-viewport');
            if (viewport) {
                viewport.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;
                      height:100%; padding:24px; text-align:center; color:#9CA3AF;">
            <div style="font-size:2.5rem; margin-bottom:12px;">📷</div>
            <div style="font-weight:600; margin-bottom:8px; color:#374151;">Camera Unavailable</div>
            <div style="font-size:0.85rem; line-height:1.5;">${err.message}</div>
          </div>
        `;
            }
        }
    }

    function bindCameraEvents() {
        // Cancel
        document.getElementById('btn-cancel').addEventListener('click', () => {
            CameraManager.stop();
            navigate('home');
        });

        // Take photo
        document.getElementById('btn-take-photo').addEventListener('click', () => {
            try {
                const imageData = CameraManager.capture();
                state.capturedImage = imageData;
                CameraManager.stop();
                renderCapturedPreview(imageData);
            } catch (err) {
                showError(err.message);
            }
        });
    }

    // ==========================================
    //  Loading Overlay
    // ==========================================

    function showLoading() {
        state.loading = true;
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Analyzing your food...</div>
      <div class="loading-subtext">AI is estimating nutrition values</div>
    `;
        document.body.appendChild(overlay);
    }

    function hideLoading() {
        state.loading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.remove();
    }

    // ==========================================
    //  API Call
    // ==========================================

    async function analyzeAndShowResults() {
        showLoading();
        state.error = null;
        state.result = null;

        try {
            const result = await NurtiMindAPI.analyzeImage(
                state.capturedImage,
                state.goal,
                state.age
            );
            state.result = result;
            hideLoading();
            navigate('results');
        } catch (err) {
            hideLoading();
            state.error = err.message;
            navigate('results');
        }
    }

    // ==========================================
    //  Results Page
    // ==========================================

    function renderResultsPage() {
        if (state.error) {
            renderErrorPage();
            return;
        }

        if (!state.result) {
            navigate('home');
            return;
        }

        const r = state.result;
        const scoreColor = getScoreColor(r.healthScore);

        appEl.innerHTML = `
      <div class="page results-page" id="results-page">
        <div class="results-header">
          <div class="food-emoji">🍽️</div>
          <h2>${escapeHTML(r.foodName)}</h2>
          <div class="portion-info">Estimated portion: ${escapeHTML(r.portionSize || 'Standard serving')}</div>
        </div>

        <div class="health-score-section">
          <div class="health-score-badge"
               style="background: ${scoreColor}10; --score-color: ${scoreColor}; --score-pct: ${r.healthScore};">
            <div class="health-score-value" style="color: ${scoreColor};">${r.healthScore}</div>
            <div class="health-score-label">Health Score</div>
          </div>
        </div>

        <div class="nutrition-grid">
          <div class="nutrition-card">
            <div class="card-icon">🔥</div>
            <div class="card-value">${r.estimatedCalories}<span class="card-unit"> kcal</span></div>
            <div class="card-label">Calories</div>
          </div>
          <div class="nutrition-card">
            <div class="card-icon">🥩</div>
            <div class="card-value">${r.protein}<span class="card-unit">g</span></div>
            <div class="card-label">Protein</div>
          </div>
          <div class="nutrition-card">
            <div class="card-icon">🍞</div>
            <div class="card-value">${r.carbs}<span class="card-unit">g</span></div>
            <div class="card-label">Carbs</div>
          </div>
          <div class="nutrition-card">
            <div class="card-icon">🧈</div>
            <div class="card-value">${r.fat}<span class="card-unit">g</span></div>
            <div class="card-label">Fat</div>
          </div>
        </div>

        ${r.warnings && r.warnings.length > 0 ? `
          <div class="warnings-section">
            ${r.warnings.map(w => `
              <div class="warning-card">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">${escapeHTML(w)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${r.recommendation ? `
          <div class="recommendation-section">
            <div class="rec-header">
              <span>💡</span> Personalized Recommendation
            </div>
            <div class="rec-text">${escapeHTML(r.recommendation)}</div>
          </div>
        ` : ''}

        <div class="cta-section">
          <button class="btn btn-primary" id="btn-analyze-another">
            <span class="btn-icon">📸</span> Analyze Another
          </button>
        </div>
      </div>
    `;

        // Analyze Another
        document.getElementById('btn-analyze-another').addEventListener('click', () => {
            state.capturedImage = null;
            state.result = null;
            state.error = null;
            navigate('home');
        });
    }

    function renderErrorPage() {
        appEl.innerHTML = `
      <div class="page results-page" id="results-page">
        <div class="error-card">
          <div class="error-icon">😕</div>
          <div class="error-title">Analysis Failed</div>
          <div class="error-message">${escapeHTML(state.error)}</div>
        </div>

        <div class="cta-section">
          <button class="btn btn-primary" id="btn-try-again">
            <span class="btn-icon">🔄</span> Try Again
          </button>
          <button class="btn btn-ghost" id="btn-go-home">
            <span class="btn-icon">🏠</span> Back to Home
          </button>
        </div>
      </div>
    `;

        document.getElementById('btn-try-again').addEventListener('click', () => {
            state.error = null;
            if (state.capturedImage) {
                analyzeAndShowResults();
            } else {
                navigate('home');
            }
        });

        document.getElementById('btn-go-home').addEventListener('click', () => {
            state.capturedImage = null;
            state.result = null;
            state.error = null;
            navigate('home');
        });
    }

    // ==========================================
    //  Utilities
    // ==========================================

    function getScoreColor(score) {
        if (score >= 75) return '#16A34A';
        if (score >= 50) return '#22C55E';
        if (score >= 30) return '#F59E0B';
        return '#EF4444';
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showError(message) {
        state.error = message;
        navigate('results');
    }

    // ==========================================
    //  Init
    // ==========================================

    function init() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { navigate, state };
})();
