// components/TabHeader.jsx
import React from 'react';
import './TabHeader.css';

const TabHeader = ({ activeTab, setActiveTab }) => {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="tab-header">
      {/* Logo */}
      <div className="logo-container">
        <img src="HeyCiti-logo.gif" alt="Logo" />
      </div>

      {/* Tabs */}
      <div className="tab-buttons">
        <button
          onClick={() => setActiveTab('modules')}
          className={activeTab === 'modules' ? 'active' : ''}
        >
          Modules
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={activeTab === 'leaderboard' ? 'active' : ''}
        >
          LeaderBoard
        </button>
      </div>

      {/* Logout */}
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default TabHeader;