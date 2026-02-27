import React from 'react';
import { Bot } from 'lucide-react';

const HealthInsights = () => {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-xl">
                        <Bot className="text-primary-500" size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Health Consultant</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Talk to your personal AI nutrition & fitness advisor</p>
                    </div>
                </div>
            </div>

            {/* Iframe Container — fills remaining height */}
            <div className="flex-1 px-2 sm:px-4 lg:px-8 pb-2 sm:pb-4 min-h-0">
                <div className="max-w-5xl mx-auto h-full bg-white dark:bg-dark-800 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-700 shadow-sm">
                    <iframe
                        src="https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJBbm5fRG9jdG9yX1NpdHRpbmdfcHVibGlj%0D%0AIiwicHJldmlld0ltZyI6Imh0dHBzOi8vZmlsZXMyLmhleWdlbi5haS9hdmF0YXIvdjMvMjZkZTM2%0D%0AOWIyZDQ0NDNlNTg2ZGVkZjI3YWYxZTBjMWRfNDU1NzAvcHJldmlld190YWxrXzEud2VicCIsIm5l%0D%0AZWRSZW1vdmVCYWNrZ3JvdW5kIjpmYWxzZSwia25vd2xlZGdlQmFzZUlkIjoiMzE3NWU1MTRlZjhj%0D%0ANDVkY2I0MjE3MmExZTA0MjY2ZDkiLCJ1c2VybmFtZSI6IjliOTNiNWI1MzM2YjQ1Yzc5ZDU2NjY4%0D%0AMWM1YjQ4Y2Y3In0%3D&inIFrame=1"
                        allow="microphone"
                        allowFullScreen
                        title="AI Health Consultant"
                        className="w-full h-full border-none"
                        style={{ minHeight: '300px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default HealthInsights;
