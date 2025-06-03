import React, { useEffect, useState } from 'react';
import TaskModal from './components/TaskModal';
import Phaser from 'phaser';
import MapScene from './game/scenes/MapScene';
import ProgressBar from './components/ProgressBar';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import UserLogin from './components/UserLogin';
import { leaderBoardService } from './api/api';
import './App.css';

function App() {
  const { user } = useAuth();
  const [taskList, setTaskList] = useState([]);
  const [modalTask, setModalTask] = useState(null);
  const [phaserGame, setPhaserGame] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const storedTasks = localStorage.getItem('taskList');
    const storedCompleted = localStorage.getItem('completedTasks');
    const storedTotal = localStorage.getItem('totalTasks');

    if (storedTasks) {
      const parsed = JSON.parse(storedTasks);
      setTaskList(parsed);
      setCompletedTasks(Number(storedCompleted) || 0);
      setTotalTasks(Number(storedTotal) || 0);
    }
  }, []);

  const handleUserIdSubmit = (id, enrichedTasks) => {
    localStorage.removeItem('playerX');
    localStorage.removeItem('playerY');

    setTaskList(enrichedTasks);
    const completed = enrichedTasks.filter(task => task.completed).length;
    setCompletedTasks(completed);
    setTotalTasks(enrichedTasks.length);

    localStorage.setItem('taskList', JSON.stringify(enrichedTasks));
    localStorage.setItem('completedTasks', completed);
    localStorage.setItem('totalTasks', enrichedTasks.length);
  };

  useEffect(() => {
    if (!user || taskList.length === 0 || activeTab !== 'modules') return;

    const gameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: window.innerWidth,
      height: window.innerHeight,
      scene: [],
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
    };

    const lastX = Number(localStorage.getItem('playerX')) || 100;
    const lastY = Number(localStorage.getItem('playerY')) || 160;

    const mapScene = new MapScene({
      onTaskTrigger: (zone) => setModalTask(zone),
      onProgressUpdate: (completed, total) => {
        setCompletedTasks(completed);
        setTotalTasks(total);
        localStorage.setItem('completedTasks', completed);
        localStorage.setItem('totalTasks', total);
      },
      initialTasks: taskList,
      user: user,
      initialPlayerX: lastX,
      initialPlayerY: lastY,
    });

    const game = new Phaser.Game(gameConfig);
    game.scene.add('MapScene', mapScene, true);
    setPhaserGame(game);

    const resizeHandler = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
      game.destroy(true);
    };
  }, [user, taskList, activeTab]);

  useEffect(() => {
    if (phaserGame) {
      const scene = phaserGame.scene.getScene('MapScene');
      if (scene && scene.setModalOpen) {
        scene.setModalOpen(!!modalTask);
      }
    }
  }, [modalTask, phaserGame]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      leaderBoardService.getUserScores()
        .then(res => {
          const sorted = res.data.sort((a, b) => b.score - a.score);
          setLeaderboardData(sorted);
        })
        .catch(err => {
          console.error('Error fetching leaderboard:', err);
        });
    }
  }, [activeTab]);

  const handleClose = () => {
    setModalTask(null);
    if (phaserGame) {
      const scene = phaserGame.scene.getScene('MapScene');
      if (scene?.setModalOpen) scene.setModalOpen(false);
    }
  };

  const handleComplete = () => {
    if (phaserGame && modalTask) {
      const scene = phaserGame.scene.getScene('MapScene');
      scene.completeZone(modalTask);
    }
    setModalTask(null);
  };

  const TabHeader = () => (
    <div className="tab-header" style={{ alignItems: 'center' }}>
      {/* Logo */}
      <div className="logo-container" style={{ marginRight: '16px' }}>
        <img src="../Resources/Citibank.png" alt="Logo" style={{ height: '40px', userSelect: 'none' }} />
      </div>

      {/* Tabs */}
      <div className="tab-buttons" style={{ flexGrow: 1 }}>
        <button onClick={() => setActiveTab('modules')} className={activeTab === 'modules' ? 'active' : ''}>Modules</button>
        <button onClick={() => setActiveTab('leaderboard')} className={activeTab === 'leaderboard' ? 'active' : ''}>LeaderBoard</button>
      </div>

      {/* Logout */}
      <button
        className="logout-button"
        onClick={() => {
          localStorage.clear();
          window.location.href = '/';
        }}
      >
        Logout
      </button>
    </div>
  );

  const renderActiveTabContent = () => {
    if (activeTab === 'leaderboard') {
      return (
        <>
          <TabHeader />
          <div className="leaderboard">
            <h2>🏆 Leaderboard</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>SOEID</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => (
                  <tr key={entry.soeid}>
                    <td>{index + 1}</td>
                    <td>{entry.soeid}</td>
                    <td>{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    return (
      <>
        <TabHeader />
        <div className="progress-wrapper">
          <ProgressBar completed={completedTasks} total={totalTasks} />
        </div>
        <div id="phaser-container" />
        {modalTask && (
          <TaskModal
            task={{ title: modalTask.name, contentUrl: modalTask.contentUrl }}
            onClose={handleClose}
            onComplete={handleComplete}
          />
        )}
      </>
    );
  };

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/game-dashboard" /> : <UserLogin onLoginComplete={handleUserIdSubmit} />}
      />
      <Route
        path="/game-dashboard"
        element={user ? renderActiveTabContent() : <Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;