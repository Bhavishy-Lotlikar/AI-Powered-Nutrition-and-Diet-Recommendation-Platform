/**
 * NurtiMind Camera Module
 * Manages getUserMedia camera stream, photo capture, and cleanup.
 */

const CameraManager = (() => {
    let stream = null;
    let videoElement = null;

    /**
     * Start the camera stream and attach to a video element.
     * Prefers rear camera on mobile devices.
     *
     * @param {HTMLVideoElement} video - Target video element
     * @returns {Promise<void>}
     */
    async function start(video) {
        videoElement = video;

        const constraints = {
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 960 },
            },
            audio: false,
        };

        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = stream;
            await videoElement.play();
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                throw new Error('Camera access denied. Please allow camera permissions and try again.');
            }
            if (err.name === 'NotFoundError') {
                throw new Error('No camera found on this device. Please use the Upload option instead.');
            }
            throw new Error('Unable to access camera. Please try again or upload an image.');
        }
    }

    /**
     * Capture a photo from the current video stream.
     * Returns base64 data URI of the captured image.
     *
     * @returns {string} Base64 data URI (image/jpeg)
     */
    function capture() {
        if (!videoElement || !stream) {
            throw new Error('Camera is not active.');
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);

        return canvas.toDataURL('image/jpeg', 0.85);
    }

    /**
     * Stop the camera stream and release resources.
     */
    function stop() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        if (videoElement) {
            videoElement.srcObject = null;
            videoElement = null;
        }
    }

    /**
     * Check if camera is currently active.
     */
    function isActive() {
        return stream !== null && stream.active;
    }

    return { start, capture, stop, isActive };
})();
