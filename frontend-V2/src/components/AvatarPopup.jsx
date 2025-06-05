import React, { useState, useEffect } from 'react';
import './AvatarPopup.css';
import { userService } from '../api/api';

const avatars = ['avatar1.png', 'avatar2.png', 'avatar3.png'];
const DEFAULT_AVATAR = 'avatar1.png';

const AvatarPopup = ({ soeid, onAvatarSelected }) => {
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [grade, setGrade] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        console.log('🧾 Checking user details for:', soeid);
        const res = await userService.getUserDetails(soeid);
        const data = res?.data;

        if (data) {
          setFullName(data.full_name || '');
          setLocation(data.location || '');
          setGrade(data.grade || '');
          setIsExistingUser(!!data.full_name && !!data.location && !!data.grade);
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    };

    fetchUserDetails();
  }, [soeid]);

  const handleSelect = async (avatar) => {
    try {
      if (isExistingUser) {
        console.log('🎨 Updating avatar to:', avatar);
        await userService.updateAvatar(soeid, avatar);
      } else {
        const details = {
          full_name: fullName.toUpperCase() || 'USER',
          location: location.toUpperCase() || 'UNKNOWN',
          grade: grade.toUpperCase() || 'C00',
          avatar,
        };
        console.log('📝 Setting new user details:', details);
        await userService.updateUserDetails(soeid, details);
      }

      localStorage.setItem('avatar', avatar || DEFAULT_AVATAR);
      onAvatarSelected(avatar || DEFAULT_AVATAR); // ✅ Pass avatar to App
    } catch (err) {
      console.error('❌ Avatar update failed:', err);
    }
  };

  return (
    <div className="avatar-popup-backdrop">
      <div className="avatar-popup">
        <h2>Let's Go!! 🚀</h2>

        <div className="form-fields">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isExistingUser}
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isExistingUser}
          />
          <input
            type="text"
            placeholder="Grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            disabled={isExistingUser}
          />
        </div>

        <div className="avatar-options">
          {avatars.map((avatar) => (
            <img
              key={avatar}
              src={avatar}
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