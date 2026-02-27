import React from 'react';
import { Camera, ScanLine, BellRing, Rocket, ArrowRight } from 'lucide-react';
import RippleGrid from '../components/common/RippleGrid';
import GlareHover from '../components/common/GlareHover';
import StarBorder from '../components/common/StarBorder';
import ScrollAnimation from '../components/layout/ScrollAnimation';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <GlareHover
        borderRadius="24px"
        glareColor="#22c55e"
        glareOpacity={0.15}
        glareAngle={-30}
        glareSize={280}
        transitionDuration={700}
    >
        <div className="glass-panel p-8 rounded-3xl h-full flex flex-col dark:bg-dark-800/60 transition-all duration-300 group border border-white/5">
            <div className="bg-primary-500/10 border border-primary-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="text-primary-500" size={26} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm flex-1">{description}</p>
        </div>
    </GlareHover>
);

const Landing = () => {
    return (
        <div className="bg-white dark:bg-dark-900 transition-colors">

            {/* Scroll-based Hero */}
            <ScrollAnimation />

            {/* Why NutriMind Section */}
            <section className="py-32 relative">
                {/* RippleGrid background layer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-60">
                    <RippleGrid
                        enableRainbow={false}
                        gridColor="#22c55e"
                        rippleIntensity={0.04}
                        gridSize={12}
                        gridThickness={20}
                        fadeDistance={1.8}
                        vignetteStrength={2.5}
                        glowIntensity={0.08}
                        opacity={0.6}
                        mouseInteraction={false}
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-block py-1 px-3 mb-4 text-xs font-semibold tracking-wider text-primary-500 uppercase rounded-full border border-primary-500/30 bg-primary-500/10">
                            Core Features
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                            Why NutriMind?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Leverage cutting-edge AI to transform your health journey. From your plate to your performance.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Camera}
                            title="AI Food Recognition"
                            description="Snap a photo of your meal and get an instant, accurate calorie and macro breakdown powered by computer vision."
                        />
                        <FeatureCard
                            icon={ScanLine}
                            title="QR Code Analysis"
                            description="Instantly scan barcodes at the grocery store to uncover hidden ingredients, additives, and nutritional value before you buy."
                        />
                        <FeatureCard
                            icon={BellRing}
                            title="Predictive Alerts"
                            description="Receive proactive alerts about potential allergens, sugar spikes, or diet deviations before they impact your health goals."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-[2.5rem] p-12 text-center relative overflow-hidden shadow-2xl border border-white/5">

                        {/* Decorative RippleGrid inside the CTA card */}
                        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none opacity-40">
                            <RippleGrid
                                enableRainbow={false}
                                gridColor="#22c55e"
                                rippleIntensity={0.06}
                                gridSize={8}
                                gridThickness={18}
                                fadeDistance={1.4}
                                vignetteStrength={2.0}
                                glowIntensity={0.15}
                                opacity={0.7}
                                mouseInteraction={false}
                            />
                        </div>

                        {/* Decorative blobs */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="bg-primary-500/15 border border-primary-500/30 p-4 rounded-2xl mb-8 backdrop-blur-md">
                                <Rocket className="text-primary-400" size={32} />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                                Ready to transform your diet?
                            </h2>
                            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Join thousands of users who have optimized their nutrition with AI.
                                Start your 14-day free trial today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-md mx-auto sm:max-w-none">
                                {/* Primary CTA with StarBorder */}
                                <StarBorder
                                    as="button"
                                    color="#22c55e"
                                    speed="4s"
                                    className="w-full sm:w-auto max-w-[280px]"
                                >
                                    <span className="flex items-center gap-2 font-bold tracking-wide">
                                    Start Your Free Trial
                                        <ArrowRight size={18} />
                                    </span>
                                </StarBorder>

                                {/* Secondary button with GlareHover */}
                                <GlareHover
                                    background="rgba(255,255,255,0.05)"
                                    borderRadius="20px"
                                    glareColor="#ffffff"
                                    glareOpacity={0.15}
                                    glareSize={250}
                                    transitionDuration={600}
                                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                                >
                                    <button className="px-7 py-4 text-white font-semibold text-sm tracking-wide w-full whitespace-nowrap">
                                        View Pricing
                                    </button>
                                </GlareHover>
                            </div>
                            <p className="text-sm text-gray-500 mt-6 tracking-wide">
                                No credit card required. Cancel anytime.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Landing;
