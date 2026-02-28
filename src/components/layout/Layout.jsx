import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import PageTransition from './PageTransition';

export const TransitionContext = React.createContext(null);
export const useTransitionNavigate = () => React.useContext(TransitionContext);

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [nextPath, setNextPath] = useState(null);
    const [transitioning, setTransitioning] = useState(false);

    const handleNavigate = (path) => {
        // Trigger grid transition for all internal navigation
        if (location.pathname !== path) {
            setNextPath(path);
            setTransitioning(true);
        }
    };

    const handleComplete = () => {
        if (nextPath) {
            navigate(nextPath);
            setNextPath(null);
            setTransitioning(false);
        }
    };

    return (
        <TransitionContext.Provider value={handleNavigate}>
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300 flex flex-col font-sans relative">
                <PageTransition trigger={transitioning} onComplete={handleComplete} />
                <Navbar />
                <main className="flex-1 w-full mt-20 sm:mt-24 relative z-0">
                    {/* key triggers remount and CSS animation on route change */}
                    <div key={location.pathname} className="page-transition">
                        <Outlet />
                    </div>
                </main>

                <footer className="w-full bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-dark-700 py-8 mt-auto relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Copyright {new Date().getFullYear()} NutriMind AI. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                            <a href="#" className="hover:text-primary-500 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-primary-500 transition-colors">Terms</a>
                            <a href="#" className="hover:text-primary-500 transition-colors">Contact</a>
                        </div>
                    </div>
                </footer>
            </div>
        </TransitionContext.Provider>
    );
};

export default Layout;
