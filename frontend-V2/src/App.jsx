import React, { useEffect, useState } from 'react';
import Phaser from 'phaser';
import { Routes, Route, Navigate } from 'react-router-dom';

import UserLogin from './components/UserLogin';
import TabHeader from './components/TabHeader';
import LeaderboardTab from './components/LeaderBoardTab';
import ModulesTab from './components/ModulesTab';
import AvatarPopup from './components/AvatarPopup';

import { useAuth } from './context/AuthContext';
import { leaderBoardService } from './api/api';
import MapScene from './game/scenes/MapScene';

import './App.css';

function App() {
  const { user } = useAuth();
  const [modulesList, setModulesList] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [modalTask, setModalTask] = useState(null);
  const [phaserGame, setPhaserGame] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);

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

  const handleUserIdSubmit = (response) => {
    console.log('handleUserIdSubmit received:', response);
    const { soeid, mappedModules, status } = response || {};

    localStorage.removeItem('playerX');
    localStorage.removeItem('playerY');

    setModulesList(mappedModules);
    const taskList = mappedModules[0]?.taskZones;
    const completed = taskList.filter(task => task.completed).length;

    setTaskList(taskList);
    setCompletedTasks(completed);
    setTotalTasks(taskList.length);

    localStorage.setItem('taskList', JSON.stringify(taskList));
    localStorage.setItem('completedTasks', completed);
    localStorage.setItem('totalTasks', taskList.length);

    if (status === 200) {
      setShowAvatarPopup(true); // new user — show popup
    }
  };

  useEffect(() => {
    if (!user || taskList.length === 0 || activeTab !== 'modules') return;

    const container = document.getElementById('phaser-container');
    if (!container) return; // Wait until DOM is ready

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
      user,
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
      if (scene?.setModalOpen) {
        scene.setModalOpen(!!modalTask);
      }
    }
  }, [modalTask, phaserGame]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      leaderBoardService.getUserScores()
        .then(res => {
          const mapped = res.data.map((user, index) => ({
            rank: index + 1,
            soeid: user.soeid,
            score: user.score,
            fullName: user.full_name,
            avatar: user.avatar,
            location: user.location,
            grade: user.grade,
          }));
  
          const sorted = mapped.sort((a, b) => b.score - a.score);
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
      scene.completeZone(modalTask); // << this was working before
    }
    setModalTask(null);
  };

  const renderActiveTabContent = () => {
    return (
      <>
        <TabHeader activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === 'leaderboard' ? (
          <LeaderboardTab leaderboardData={leaderboardData} />
        ) : (
          <ModulesTab
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            modalTask={modalTask}
            onCloseModal={handleClose}
            onCompleteModal={handleComplete}
          />
        )}
      </>
    );
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/game-dashboard" />
            ) : (
              <UserLogin onLoginComplete={handleUserIdSubmit} />
            )
          }
        />
        <Route
          path="/game-dashboard"
          element={user ? renderActiveTabContent() : <Navigate to="/" />}
        />
      </Routes>
      {showAvatarPopup && (
        <AvatarPopup
          soeid={user}
          onAvatarSelected={() => setShowAvatarPopup(false)}
        />
      )}
    </>
  );
}

export default App;