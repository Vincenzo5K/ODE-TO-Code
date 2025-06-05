// components/ProgressBar.tsx
import React from 'react';
import './ProgressBar.css'; // optional for styling

const ProgressBar = ({ completed, total }) => {
  const percent = total === 0 ? 0 : (completed / total) * 100;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      <span className="progress-bar-text">{Math.round(percent)}%</span>
    </div>
  );
};

export default ProgressBar;