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
                <th className="rank-cell">
                  <span className="rank-badge-placeholder" />
                  Rank
                </th>
                <th>SOEID</th>
                <th>Full Name</th>
                <th>Location</th>
                <th>Grade</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry, index) => (
                <tr key={entry.soeid}>
                  <td className="rank-cell">
                    {index < 3 ? (
                      <span className={`rank-badge rank-${index + 1}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="rank-badge-placeholder" />
                    )}
                    <span className="rank-number">{index + 1}</span>
                  </td>
                  <td>{entry.soeid}</td>
                  <td>{entry.fullName}</td>
                  <td>{entry.location}</td>
                  <td>{entry.grade}</td>
                  <td>{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default LeaderboardTab;