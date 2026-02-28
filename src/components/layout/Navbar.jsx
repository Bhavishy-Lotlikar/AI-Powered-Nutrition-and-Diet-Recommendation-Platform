import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Sun, Moon, User, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';
import { useTransitionNavigate } from './Layout';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const navigateWithTransition = useTransitionNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Food Scanner', path: '/food-detection' },
        { name: 'Analysis', path: '/nutrition-analysis' },
        { name: 'Exercise', path: '/exercise-plan' },
        { name: 'Health', path: '/predictive-health' },
        { name: 'Recommendations', path: '/recommendations' },
        { name: 'AI Consultant', path: '/health-insights' },
        { name: 'Profile', path: '/profile' },
    ];

    const getLinkClasses = ({ isActive }) => clsx(
        'transition-colors duration-200 text-sm font-medium px-3 py-2 rounded-lg',
        isActive
            ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-dark-800'
    );

    return (
        <nav className={clsx(
            'fixed top-0 inset-x-0 z-50 transition-all duration-300',
            isScrolled
                ? 'glass-panel py-3'
                : 'bg-transparent py-5'
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-primary-500 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                            <BrainCircuit size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Nutri<span className="text-primary-500">Mind</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={getLinkClasses}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigateWithTransition(link.path);
                                }}
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </div>

                    {/* Actions (Desktop & Mobile) */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="hidden sm:flex items-center gap-2">
                            {user ? (
                                <button
                                    onClick={() => signOut()}
                                    title="Sign Out"
                                    className="relative group cursor-pointer p-1.5 rounded-full border border-gray-200 dark:border-dark-700 hover:border-red-500 transition-colors"
                                >
                                    <User size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-red-500" />
                                </button>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2">
                                        Sign In
                                    </Link>
                                    <Link to="/signup" className="text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="lg:hidden p-2 text-gray-600 dark:text-gray-300"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 dark:border-dark-700">
                        <div className="flex flex-col space-y-1 mt-4">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={getLinkClasses}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsMobileMenuOpen(false);
                                        navigateWithTransition(link.path);
                                    }}
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                            {!user && (
                                <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 sm:hidden">
                                    <Link to="/login" className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 py-2 border border-gray-300 dark:border-dark-600 rounded-xl">
                                        Sign In
                                    </Link>
                                    <Link to="/signup" className="text-center text-sm font-medium bg-primary-500 text-white py-2 rounded-xl shadow-sm">
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
