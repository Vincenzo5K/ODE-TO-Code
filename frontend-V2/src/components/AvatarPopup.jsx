// src/components/AvatarPopup.jsx
import React from 'react';
import './AvatarPopup.css'; // style it nicely

const avatars = ['avatar1.png', 'avatar2.png', 'avatar3.png'];

const AvatarPopup = ({ soeid, onAvatarSelected }) => {
  const handleSelect = async (avatar) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/user/${soeid}/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar }),
      });
      onAvatarSelected(); // close popup and load dashboard
    } catch (err) {
      console.error('Avatar update failed:', err);
    }
  };

  return (
    <div className="avatar-popup-backdrop">
      <div className="avatar-popup">
        <h2>Select Your Character</h2>
        <div className="avatar-options">
          {avatars.map((avatar) => (
            <img
              key={avatar}
              src={`${avatar}`}
              alt={avatar}
              onClick={() => handleSelect(avatar)}
              className="avatar-img"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarPopup;