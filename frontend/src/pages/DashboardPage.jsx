import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Flame, Droplet, Apple, Pizza } from 'lucide-react';
import AlertsComponent from '../components/AlertsComponent';
import './DashboardPage.css';

const API_BASE_URL = 'http://localhost:8000';
// Mock User ID for demo purposes
const USER_ID = 'user_123';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    meals: [],
    alerts: []
  });
  
  const [newMeal, setNewMeal] = useState({
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const calorieGoal = 2000;

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get-dashboard/${USER_ID}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback empty state if backend is down
      setDashboardData({
         calories: 0, protein: 0, carbs: 0, fats: 0, meals: [], alerts: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    if (!newMeal.food_name || !newMeal.calories) return;

    try {
      await axios.post(`${API_BASE_URL}/log-meal`, {
        user_id: USER_ID,
        food_name: newMeal.food_name,
        calories: Number(newMeal.calories),
        protein: Number(newMeal.protein || 0),
        carbs: Number(newMeal.carbs || 0),
        fats: Number(newMeal.fats || 0)
      });
      
      // Reset form & refresh dashboard
      setNewMeal({ food_name: '', calories: '', protein: '', carbs: '', fats: '' });
      fetchDashboard();
    } catch (error) {
      console.error('Error logging meal:', error);
    }
  };

  const progressPercentage = Math.min((dashboardData.calories / calorieGoal) * 100, 100);
  const isOverGoal = dashboardData.calories > calorieGoal;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Daily Overview</h2>
        <p>Track your nutrition and hit your goals</p>
      </div>

      <AlertsComponent alerts={dashboardData.alerts} />

      <div className="dashboard-grid">
        {/* Left Column: Stats & Log Form */}
        <div className="dashboard-col">
          <div className="stats-card glass-panel">
            <h3>Calories</h3>
            <div className="calorie-summary">
              <span className={`calorie-total ${isOverGoal ? 'danger' : ''}`}>
                {dashboardData.calories}
              </span>
              <span className="calorie-goal">/ {calorieGoal} kcal</span>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className={`progress-bar ${isOverGoal ? 'danger' : ''}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            <div className="macros-grid">
              <div className="macro-item">
                <div className="macro-icon protein"><Droplet size={16} /></div>
                <div className="macro-details">
                  <span>Protein</span>
                  <strong>{dashboardData.protein}g</strong>
                </div>
              </div>
              <div className="macro-item">
                <div className="macro-icon carbs"><Apple size={16} /></div>
                <div className="macro-details">
                  <span>Carbs</span>
                  <strong>{dashboardData.carbs}g</strong>
                </div>
              </div>
              <div className="macro-item">
                <div className="macro-icon fats"><Pizza size={16} /></div>
                <div className="macro-details">
                  <span>Fats</span>
                  <strong>{dashboardData.fats}g</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="log-form-card glass-panel">
            <h3><Plus size={18} /> Log Meal</h3>
            <form onSubmit={handleLogMeal} className="log-form">
              <div className="input-group">
                <label>Food Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Grilled Chicken Salad"
                  value={newMeal.food_name}
                  onChange={e => setNewMeal({...newMeal, food_name: e.target.value})}
                />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Calories</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="kcal"
                    value={newMeal.calories}
                    onChange={e => setNewMeal({...newMeal, calories: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Protein (g)</label>
                  <input 
                    type="number" 
                    placeholder="g"
                    value={newMeal.protein}
                    onChange={e => setNewMeal({...newMeal, protein: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Carbs (g)</label>
                  <input 
                    type="number" 
                    placeholder="g"
                    value={newMeal.carbs}
                    onChange={e => setNewMeal({...newMeal, carbs: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Fats (g)</label>
                  <input 
                    type="number" 
                    placeholder="g"
                    value={newMeal.fats}
                    onChange={e => setNewMeal({...newMeal, fats: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">Add Meal</button>
            </form>
          </div>
        </div>

        {/* Right Column: Meal History */}
        <div className="dashboard-col">
          <div className="history-card glass-panel">
            <h3>Today's Meals</h3>
            {isLoading ? (
              <div className="loading-state">Loading meals...</div>
            ) : dashboardData.meals.length === 0 ? (
              <div className="empty-state">
                <Pizza size={40} opacity={0.5} />
                <p>No meals logged today. Start eating!</p>
              </div>
            ) : (
              <div className="meal-list">
                {dashboardData.meals.map((meal, idx) => (
                  <div key={idx} className="meal-item">
                    <div className="meal-info">
                      <h4>{meal.food_name}</h4>
                      <p>{meal.calories} kcal</p>
                    </div>
                    <div className="meal-macros-mini">
                      <span>P: {meal.protein}g</span> • 
                      <span>C: {meal.carbs}g</span> • 
                      <span>F: {meal.fats}g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
