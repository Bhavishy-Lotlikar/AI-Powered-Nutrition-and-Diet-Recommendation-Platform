import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Mail, Lock, AlertCircle } from 'lucide-react';
import { useTransitionNavigate } from '../components/layout/Layout';

const AuthPage = ({ initialMode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { signIn, signUp } = useAuth();
    const navigateWithTransition = useTransitionNavigate();
    const location = useLocation();

    // Redirect to where they were trying to go, or dashboard
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error: signInError } = await signIn(email, password);
                if (signInError) throw signInError;
                navigateWithTransition(from);
            } else {
                const { error: signUpError } = await signUp(email, password);
                if (signUpError) throw signUpError;
                // Supabase typically sends confirmation email
                alert('Account created! Please check your email to verify (or try logging in if auto-verified).');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full glass-panel bg-white dark:bg-dark-800 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-dark-700">
                <div className="text-center mb-8">
                    <div className="bg-primary-500 text-white p-3 rounded-2xl inline-block mb-4 shadow-lg shadow-primary-500/30">
                        <BrainCircuit size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {isLogin ? 'Enter your details to access your account' : 'Start your health optimization journey today'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 sm:bg-red-500/10 border border-red-200 sm:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="text-gray-400" size={20} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-dark-600 rounded-2xl bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="text-gray-400" size={20} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-dark-600 rounded-2xl bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all mt-8"
                    >
                        {loading
                            ? 'Processing...'
                            : isLogin ? 'Sign In' : 'Create Account'
                        }
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
