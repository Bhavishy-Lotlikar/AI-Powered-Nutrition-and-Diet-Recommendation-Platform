/**
 * NurtiMind Image Upload Module
 * Handles file input selection and conversion to base64.
 */

const ImageUploader = (() => {
    /**
     * Create a hidden file input and trigger it. Resolves with base64 data URI.
     *
     * @returns {Promise<string>} Base64 data URI of selected image
     */
    function selectImage() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.className = 'file-input-hidden';

            input.addEventListener('change', () => {
                const file = input.files[0];
                if (!file) {
                    reject(new Error('No image selected.'));
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    reject(new Error('Please select an image file.'));
                    return;
                }

                // Limit to 8MB
                if (file.size > 8 * 1024 * 1024) {
                    reject(new Error('Image is too large. Please select an image under 8MB.'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Failed to read the image file.'));
                reader.readAsDataURL(file);
            });

            // Handle cancel
            input.addEventListener('cancel', () => {
                reject(new Error('__cancelled__'));
            });

            document.body.appendChild(input);
            input.click();

            // Cleanup after a delay
            setTimeout(() => {
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                }
            }, 60000);
        });
    }

    return { selectImage };
})();
