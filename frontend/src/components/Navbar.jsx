import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, MessageSquare, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Activity size={28} color="var(--accent-primary)" />
        <span>NutriAI</span>
      </div>
      <div className="nav-links">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/chat" 
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          <MessageSquare size={20} />
          <span>AI Assistant</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
