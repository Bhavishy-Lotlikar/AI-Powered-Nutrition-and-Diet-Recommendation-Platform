import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-9xl font-black text-gray-100 dark:text-dark-700 select-none">404</h1>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">Page Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">The page you are looking for does not exist or has been moved.</p>
            <Link to="/" className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-primary-500/25">
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
