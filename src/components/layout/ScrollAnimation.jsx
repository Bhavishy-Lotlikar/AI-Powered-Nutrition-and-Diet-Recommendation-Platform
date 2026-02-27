import React, { useEffect, useRef, useState } from 'react';

const ScrollAnimation = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [images, setImages] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);

    const FRAME_COUNT = 80;

    // Preload images
    useEffect(() => {
        let loadedCount = 0;
        const imgArray = [];

        const loadImages = async () => {
            for (let i = 1; i <= FRAME_COUNT; i++) {
                const img = new Image();
                const indexStr = i.toString().padStart(3, '0');
                img.src = `/Home/ezgif-frame-${indexStr}.png`;
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === FRAME_COUNT) {
                        setLoaded(true);
                        drawFrame(0); // Draw the first frame once all are loaded
                    }
                };
                imgArray.push(img);
            }
            setImages(imgArray);
        };

        loadImages();
    }, []);

    // Handle Scroll
    useEffect(() => {
        if (!loaded) return;

        const handleScroll = () => {
            if (!containerRef.current) return;

            const scrollTop = window.scrollY;
            const maxScroll = containerRef.current.scrollHeight - window.innerHeight;

            // Calculate fraction of scroll completed
            const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));

            // Calculate which frame to show
            const frameIndex = Math.min(
                FRAME_COUNT - 1,
                Math.floor(scrollFraction * FRAME_COUNT)
            );

            if (frameIndex !== currentFrame) {
                setCurrentFrame(frameIndex);
                drawFrame(frameIndex);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loaded, images, currentFrame]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (loaded) drawFrame(currentFrame);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [loaded, currentFrame]);


    const drawFrame = (frameIndex) => {
        const canvas = canvasRef.current;
        if (!canvas || !images[frameIndex]) return;

        const context = canvas.getContext('2d');

        // Make canvas full screen size for crisp rendering
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const img = images[frameIndex];

        // Maintain aspect ratio while covering the canvas
        const xRatio = canvas.width / img.width;
        const yRatio = canvas.height / img.height;
        const ratio = Math.max(xRatio, yRatio); // Change to Math.min for contain

        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
            img,
            0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
        );
    };

    return (
        <div ref={containerRef} className="relative h-[400vh] w-full bg-dark-900">
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* The Animated Canvas Background */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />

                {/* Overlay gradient to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-dark-900/90 via-dark-900/50 to-transparent z-10" />

                {/* Foreground Content wrapper container */}
                <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">

                    <div className="max-w-2xl text-left">
                        <span className="inline-block py-1 px-3 mb-4 text-xs font-semibold tracking-wider text-primary-500 uppercase rounded-full border border-primary-500/30 bg-primary-500/10 backdrop-blur-sm">
                            Next-Gen Health Tracking
                        </span>

                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight mb-6 mt-0">
                            Smart Nutrition
                            <span className="block text-primary-400 mt-2">Powered by AI</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 font-medium mb-10 max-w-xl leading-relaxed">
                            Stop guessing calories. Get personalized diet plans, real-time food analysis, and predictive health alerts instantly with a simple snap.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-16">
                            <button className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1">
                                Start Your Free Trial
                            </button>
                            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-2xl transition-all backdrop-blur-sm">
                                Watch Demo
                            </button>
                        </div>

                        {/* Stats or trust signals */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-white/10">
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-1">50K+</h3>
                                <p className="text-sm text-gray-400">Active Users</p>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-1">2M+</h3>
                                <p className="text-sm text-gray-400">Foods Analyzed</p>
                            </div>
                            <div className="hidden md:block">
                                <h3 className="text-3xl font-bold text-white mb-1">95%</h3>
                                <p className="text-sm text-gray-400">Accuracy Rate</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Loading Indicator */}
                {!loaded && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-primary-400 font-medium">Initializing AI Assets...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScrollAnimation;
