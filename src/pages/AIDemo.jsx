import React, { useState } from 'react';
import { Mic, MicOff, Brain, Volume2 } from 'lucide-react';

const states = ['idle', 'listening', 'processing', 'speaking'];

const stateConfig = {
    idle: { label: 'Ready', color: 'bg-gray-400', ring: '', icon: Mic },
    listening: { label: 'Listening', color: 'bg-blue-500', ring: 'ring-4 ring-blue-200 dark:ring-blue-900 animate-pulse', icon: Mic },
    processing: { label: 'Thinking', color: 'bg-amber-500', ring: 'ring-4 ring-amber-200 dark:ring-amber-900 animate-pulse', icon: Brain },
    speaking: { label: 'Speaking', color: 'bg-primary-500', ring: 'ring-4 ring-primary-200 dark:ring-primary-900 animate-pulse', icon: Volume2 },
};

const mockTranscript = "What should I eat to improve my iron levels?";
const mockResponse = "Great question! For improving iron levels, I recommend incorporating dark leafy greens like spinach and kale, legumes such as lentils and chickpeas, lean red meat in moderation, and pairing iron-rich foods with Vitamin C sources to enhance absorption. Avoid tea or coffee immediately after meals as they can inhibit iron uptake.";

const AIDemo = () => {
    const [status, setStatus] = useState('idle');
    const [showTranscript, setShowTranscript] = useState(false);

    const handleMicClick = () => {
        if (status === 'idle') {
            setStatus('listening');
            setShowTranscript(false);
            setTimeout(() => setStatus('processing'), 3000);
            setTimeout(() => { setStatus('speaking'); setShowTranscript(true); }, 5000);
            setTimeout(() => setStatus('idle'), 10000);
        } else {
            setStatus('idle');
            setShowTranscript(false);
        }
    };

    const cfg = stateConfig[status];
    const Icon = cfg.icon;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Avatar Demo</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Real-time AI nutrition assistant — voice-powered and context-aware.</p>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Avatar */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900 rounded-[2.5rem] p-10 min-h-[480px] relative overflow-hidden">
                    {/* Decorative rings */}
                    <div className="absolute w-64 h-64 rounded-full border border-primary-500/10"></div>
                    <div className="absolute w-80 h-80 rounded-full border border-primary-500/5"></div>

                    {/* Avatar circle */}
                    <div className={`relative w-36 h-36 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-900/30 flex items-center justify-center mb-8 transition-all duration-500 ${cfg.ring}`}>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/30">
                            <Brain size={48} className="text-white" />
                        </div>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`}></div>
                        <span className="text-white font-semibold text-sm tracking-wide">{cfg.label}</span>
                    </div>

                    {/* Microphone button */}
                    <button
                        onClick={handleMicClick}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${status === 'idle'
                                ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/30 hover:scale-110'
                                : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                            }`}
                    >
                        {status === 'idle' ? <Mic size={26} /> : <MicOff size={26} />}
                    </button>
                    <p className="text-gray-400 text-xs mt-4">{status === 'idle' ? 'Click to start talking' : 'Click to stop'}</p>
                </div>

                {/* Right: Transcript Panel */}
                <div className="flex flex-col gap-6">
                    {/* Live Transcript */}
                    <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-gray-100 dark:border-dark-700 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900 dark:text-white">Live Transcript</h2>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status === 'listening' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${status === 'listening' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                {status === 'listening' ? 'Recording' : 'Idle'}
                            </div>
                        </div>
                        <div className="min-h-[80px] flex items-center">
                            {showTranscript ? (
                                <p className="text-gray-700 dark:text-gray-300 italic">"{mockTranscript}"</p>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm">Your speech will appear here...</p>
                            )}
                        </div>
                    </div>

                    {/* AI Response */}
                    <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-gray-100 dark:border-dark-700 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900 dark:text-white">AI Response</h2>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status === 'speaking' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${status === 'speaking' ? 'bg-primary-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                {status === 'speaking' ? 'Speaking' : 'Standby'}
                            </div>
                        </div>
                        <div className="min-h-[120px] flex items-start">
                            {showTranscript ? (
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{mockResponse}</p>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm">AI response will appear here after processing...</p>
                            )}
                        </div>
                    </div>

                    {/* Integration Hint */}
                    <div className="bg-dark-800/50 dark:bg-dark-900/50 rounded-3xl p-5 border border-dark-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            <span className="font-bold text-primary-400">Integration Ready: </span>
                            Connect Whisper (STT), Gemini API streaming (LLM), and Coqui TTS to enable full real-time voice conversation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIDemo;
