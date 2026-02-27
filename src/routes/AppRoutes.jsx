import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import {
    Landing,
    Dashboard,
    LogFood,
    FoodDetection,
    NutritionAnalysis,
    PredictiveHealth,
    Recommendations,
    HealthInsights,
    ExercisePlan,
    Profile,
    AIDemo,
    AuthPage,
    NotFound
} from '../pages';

// Helper to redirect authenticated users away from login/signup
const PublicOnlyRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                {/* Public Home Route */}
                <Route index element={<Landing />} />

                {/* Auth Routes */}
                <Route path="login" element={
                    <PublicOnlyRoute><AuthPage initialMode="login" /></PublicOnlyRoute>
                } />
                <Route path="signup" element={
                    <PublicOnlyRoute><AuthPage initialMode="signup" /></PublicOnlyRoute>
                } />

                {/* Demo Route (Public) */}
                <Route path="ai-demo" element={<AIDemo />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="log-food" element={<Navigate to="/food-detection" replace />} />
                    <Route path="food-detection" element={<FoodDetection />} />
                    <Route path="nutrition-analysis" element={<NutritionAnalysis />} />
                    <Route path="predictive-health" element={<PredictiveHealth />} />
                    <Route path="recommendations" element={<Recommendations />} />
                    <Route path="health-insights" element={<HealthInsights />} />
                    <Route path="exercise-plan" element={<ExercisePlan />} />
                    <Route path="profile" element={<Profile />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
