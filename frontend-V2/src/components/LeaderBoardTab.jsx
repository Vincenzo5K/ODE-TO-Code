import React from 'react';
import './LeaderboardTab.css';

const LeaderboardTab = ({ leaderboardData }) => {
  return (
    <>
      <div className="leaderboard-tab">
        <div className="leaderboard">
          <h2>🏆 Leaderboard</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>SOEID</th>
                <th>Full Name</th>
                <th>Avatar</th>
                <th>Location</th>
                <th>Grade</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry, index) => (
                <tr key={entry.soeid}>
                  <td>{index + 1}</td>
                  <td>{entry.soeid}</td>
                  <td>{entry.fullName}</td>
                  <td>
                    <img
                      src={`${entry.avatar}`}
                      alt={entry.avatar}
                      style={{ width: '32px', height: '32px' }}
                    />
                  </td>
                  <td>{entry.location}</td>
                  <td>{entry.grade}</td>
                  <td>{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="helpful-links">
          <h2>Helpful Links 🔗</h2>
          <ul>
            <li><a href="http://" target="_blank" rel="noopener noreferrer">Link1</a></li>
            <li><a href="http://" target="_blank" rel="noopener noreferrer">Link2</a></li>
            <li><a href="http://" target="_blank" rel="noopener noreferrer">Link3</a></li>
            <li><a href="http://" target="_blank" rel="noopener noreferrer">Link4</a></li>
            <li><a href="http://" target="_blank" rel="noopener noreferrer">Link5</a></li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default LeaderboardTab;