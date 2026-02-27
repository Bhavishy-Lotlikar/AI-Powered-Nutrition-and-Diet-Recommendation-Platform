import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import './AlertsComponent.css';

const AlertsComponent = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  const getIcon = (type) => {
    switch(type) {
      case 'danger': return <AlertTriangle size={20} />;
      case 'warning': return <AlertCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  return (
    <div className="alerts-container glass-panel">
      <h3 className="alerts-title">Health Risk Alerts</h3>
      <div className="alerts-list">
        {alerts.map((alert, index) => (
          <div key={index} className={`alert-card ${alert.type}`}>
            <div className="alert-icon">
              {getIcon(alert.type)}
            </div>
            <div className="alert-content">
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsComponent;
