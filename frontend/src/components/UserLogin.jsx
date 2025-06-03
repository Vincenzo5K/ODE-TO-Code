import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import citiBankLogo from '../../Resources/Citibank.png';
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
    if (soeid.length !== 7) {
      setError('Please enter a valid SOEID of 7 characters.');
      return;
    }

    try {
      console.log('➡️ Logging in with:', soeid);

      let allTasks = [];
      let userStatus = [];

      try {
        const res = await userService.createUser(soeid);
        console.log('User create response:', res.data.message); // "user exists" or "user created"
        login(soeid); // Moved here: auth context login after success
        console.log('📡 Fetching tasks and user task status...');
        const [tasksRes, statusRes] = await Promise.all([
          userService.getTasks(),
          userService.getUserTaskStatus(soeid),
        ]);
        allTasks = tasksRes.data;
        userStatus = statusRes.data;
      } catch (err) {
        console.warn('User creation failed:', err);
        setError('Failed to create or verify user.');
        return;
      }

      console.log('📦 All tasks:', allTasks);
      console.log('📊 User task status:', userStatus);

      const safeUserStatus = Array.isArray(userStatus) ? userStatus : [];

      const enriched = allTasks.map((task) => ({
        // rename whatever the backend actually sends
        name:        task.name,
        x:           task.x ?? 0,
        y:           task.y ?? 0,
        contentUrl:  task.contentUrl || '',
        completed:   safeUserStatus.some(
                       (ut) => ut.task_name === (task.name || task.task_name) && ut.completed
                     ),
      }));

      console.log('🧠 Enriched tasks:', enriched);

      onLoginComplete(soeid, enriched); // pass to App
      console.log('🚀 Navigating to dashboard...');
      navigate('/game-dashboard');
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
              onChange={(e) => setSoeid(e.target.value)}
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