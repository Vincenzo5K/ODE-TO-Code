import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import citiBankLogo from '../../Resources/CitibankLogo.png';
import { useAuth } from '../context/AuthContext';
import './UserLogin.css';
import { userService } from '../api/api';

export default function UserLogin({ onLoginComplete }) {
  const { login } = useAuth();
  const [soeid, setSoeid] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const upperSoeid = soeid.toUpperCase();
    setSoeid(upperSoeid);
    if (upperSoeid.length !== 7) {
      setError('Please enter a valid SOEID of 7 characters.');
      return;
    }

    try {
      console.log('➡️ Logging in with:', upperSoeid);

      let allModules = [];

      try {
        const res = await userService.createUser(upperSoeid);
        const status = res.status;
        console.log('User create response:', res.data.message); // "user exists" or "user created"
        login(upperSoeid); // Moved here: auth context login after success
        console.log('📡 Fetching all modules and user task status...');
        const [modulesRes] = await Promise.all([
          userService.getUserTaskStatus(upperSoeid),
        ]);
        allModules = modulesRes.data;

        console.log('📦 All Modules:', allModules);

        const mappedModules = allModules.map(module => ({
          moduleName: module.module_name,
          mapImage: module.map,
          taskZones: module.taskZone.map(zone => ({
            name: zone.name,
            x: zone.x,
            y: zone.y,
            completed: zone.completed,
            contentUrl: zone.contentUrl,
            contentType: zone.content_type,
          })),
        }));

        console.log('🧠 Enriched Modules:', mappedModules);

        onLoginComplete({ soeid: upperSoeid, mappedModules, status }); // pass to App
        console.log('🚀 Navigating to dashboard...');
        navigate('/game-dashboard');
      } catch (err) {
        console.warn('User creation failed:', err);
        setError('Failed to create or verify user.');
        return;
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="wrapper signIn">
      <div className="illustration">
        <img src={citiBankLogo} alt="illustration" />
      </div>
      <div className="form">
        <div className="heading">LOGIN</div>
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="soeid">SOEID</label>
            <input
              type="text"
              id="soeid"
              maxLength={7}
              value={soeid}
              onChange={(e) => setSoeid(e.target.value.toUpperCase())}
              placeholder="Enter your SOEID"
              required
            />
          </div>
          <button type="submit">Submit</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}