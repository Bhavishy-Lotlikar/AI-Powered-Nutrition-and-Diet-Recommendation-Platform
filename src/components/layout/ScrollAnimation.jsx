import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollAnimation = ({ onNavigatePricing }) => {
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const targetTimeRef = useRef(0);
    const currentTimeRef = useRef(0);
    const rafRef = useRef(null);
    const seekingRef = useRef(false);

    // Scroll progress
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start']
    });

    // Framer Motion scroll-driven transforms
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 0.85]);
    const borderRadius = useTransform(scrollYProgress, [0, 0.3, 0.6], ['0px', '0px', '48px']);
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

    // Text cascade animations
    const titleOpacity = useTransform(scrollYProgress, [0, 0.08, 0.5, 0.7], [0, 1, 1, 0]);
    const titleY = useTransform(scrollYProgress, [0, 0.08, 0.5, 0.7], [60, 0, 0, -80]);
    const subtitleOpacity = useTransform(scrollYProgress, [0.03, 0.12, 0.5, 0.65], [0, 1, 1, 0]);
    const subtitleY = useTransform(scrollYProgress, [0.03, 0.12, 0.5, 0.65], [40, 0, 0, -60]);
    const buttonsOpacity = useTransform(scrollYProgress, [0.06, 0.16, 0.45, 0.6], [0, 1, 1, 0]);
    const buttonsY = useTransform(scrollYProgress, [0.06, 0.16, 0.45, 0.6], [30, 0, 0, -40]);
    const statsOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.4, 0.55], [0, 1, 1, 0]);
    const statsY = useTransform(scrollYProgress, [0.1, 0.2, 0.4, 0.55], [30, 0, 0, -30]);
    const overlayOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 0.4, 0.7]);

    // Draw current video frame to canvas (avoids stale video element rendering)
    const drawToCanvas = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        const ctx = canvas.getContext('2d');
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        // Cover mode — maintain aspect ratio
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const ratio = Math.max(canvas.width / vw, canvas.height / vh);
        const cx = (canvas.width - vw * ratio) / 2;
        const cy = (canvas.height - vh * ratio) / 2;

        ctx.drawImage(video, 0, 0, vw, vh, cx, cy, vw * ratio, vh * ratio);
    }, []);

    // Smooth seeking loop — lerps toward target time to avoid seek queue floods
    const startRenderLoop = useCallback(() => {
        const tick = () => {
            const video = videoRef.current;
            if (!video || !video.duration) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const target = targetTimeRef.current;
            const current = currentTimeRef.current;
            const diff = Math.abs(target - current);

            // Only seek if difference is meaningful (> 1 frame at 30fps)
            if (diff > 0.02 && !seekingRef.current) {
                seekingRef.current = true;
                // Use fastSeek if available (non-blocking), fallback to currentTime
                if (video.fastSeek) {
                    video.fastSeek(target);
                } else {
                    video.currentTime = target;
                }
                currentTimeRef.current = target;
            }

            drawToCanvas();
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
    }, [drawToCanvas]);

    // Preload entire video into memory via fetch + blob URL for instant seeking
    useEffect(() => {
        const loadVideo = async () => {
            try {
                const response = await fetch('/landing/Flow_delpmaspu_ (2).mp4');
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const video = videoRef.current;
                if (!video) return;

                video.src = blobUrl;
                video.load();
            } catch (err) {
                console.error('Video preload failed, using direct src:', err);
                // Fallback: use direct URL
                const video = videoRef.current;
                if (video) video.src = '/landing/Flow_delpmaspu_ (2).mp4';
            }
        };

        loadVideo();

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // When video metadata is ready
    const handleLoaded = () => {
        const video = videoRef.current;
        if (!video) return;
        video.pause();
        video.currentTime = 0;
        setLoaded(true);
        startRenderLoop();
    };

    // Clear seeking flag when browser finishes seeking
    const handleSeeked = () => {
        seekingRef.current = false;
        drawToCanvas();
    };

    // Sync scroll progress → target time
    useEffect(() => {
        if (!loaded) return;

        const unsubscribe = scrollYProgress.on('change', (v) => {
            const video = videoRef.current;
            if (video && video.duration) {
                targetTimeRef.current = v * video.duration;
            }
        });

        return () => unsubscribe();
    }, [loaded, scrollYProgress]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => drawToCanvas();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawToCanvas]);

    return (
        <div ref={containerRef} className="relative h-[400vh] w-full bg-dark-900">
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* Zoom + rounded wrapper */}
                <motion.div
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{ scale, borderRadius, y }}
                >
                    {/* Hidden video (source for canvas) */}
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        preload="auto"
                        onLoadedData={handleLoaded}
                        onSeeked={handleSeeked}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                    />
                    {/* Canvas renders the video frame (smoother than direct video) */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                    />
                </motion.div>

                {/* Dark overlay */}
                <motion.div
                    className="absolute inset-0 bg-dark-900 pointer-events-none z-10"
                    style={{ opacity: overlayOpacity }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-dark-900/80 via-dark-900/40 to-transparent z-10 pointer-events-none" />

                {/* Foreground Content */}
                <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                    <div className="max-w-2xl text-left">

                        <motion.span
                            className="inline-block py-1 px-3 mb-4 text-xs font-semibold tracking-wider text-primary-500 uppercase rounded-full border border-primary-500/30 bg-primary-500/10 backdrop-blur-sm"
                            style={{ opacity: titleOpacity, y: titleY }}
                        >
                            Next-Gen Health Tracking
                        </motion.span>

                        <motion.h1
                            className="text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-tight mb-6 mt-0"
                            style={{ opacity: titleOpacity, y: titleY }}
                        >
                            Smart Nutrition
                            <span className="block text-primary-400 mt-2">Powered by AI</span>
                        </motion.h1>

                        <motion.p
                            className="text-lg md:text-xl text-gray-300 font-medium mb-10 max-w-xl leading-relaxed"
                            style={{ opacity: subtitleOpacity, y: subtitleY }}
                        >
                            Stop guessing calories. Get personalized diet plans, real-time food analysis, and predictive health alerts instantly with a simple snap.
                        </motion.p>

                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 mb-16"
                            style={{ opacity: buttonsOpacity, y: buttonsY }}
                        >
                            <button
                                onClick={onNavigatePricing}
                                className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1"
                            >
                                View Pricing
                            </button>
                            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-2xl transition-all backdrop-blur-sm">
                                Watch Demo
                            </button>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-white/10"
                            style={{ opacity: statsOpacity, y: statsY }}
                        >
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
                        </motion.div>
                    </div>
                </div>

                {/* Loading */}
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
