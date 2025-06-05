import React, { useState, useEffect } from 'react';
import './TabHeader.css';
import { userService } from '../api/api';

const TabHeader = ({ activeTab, setActiveTab }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const soeid = localStorage.getItem('soeid');
  const avatar = localStorage.getItem('avatar') || 'avatar1.png';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const togglePopup = async () => {
    if (!showPopup) {
      try {
        const res = await userService.getUserDetails(soeid);
        setUserDetails(res.data);
        setShowPopup(true);
      } catch (err) {
        console.error('Failed to fetch user details:', err);
      }
    } else {
      setShowPopup(false);
    }
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

      {/* Avatar + Logout */}
      <div className="right-controls">
        <img
          src={avatar}
          alt="Profile"
          className="avatar-icon"
          onClick={togglePopup}
          style={{ cursor: 'pointer' }}
        />
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Popup */}
      {showPopup && userDetails && (
        <div className="user-popup" onClick={() => setShowPopup(false)}>
          <div className="user-popup-content" onClick={e => e.stopPropagation()}>
            <h3>User Profile</h3>
            <img src={userDetails.avatar} alt="Avatar" className="popup-avatar" />
            <p><strong>SOEID:</strong> {userDetails.soeid}</p>
            <p><strong>Full Name:</strong> {userDetails.full_name}</p>
            <p><strong>Location:</strong> {userDetails.location}</p>
            <p><strong>Grade:</strong> {userDetails.grade}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabHeader;