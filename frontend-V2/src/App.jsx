import React, { useEffect, useState } from 'react';
import Phaser from 'phaser';
import { Routes, Route, Navigate } from 'react-router-dom';

import UserLogin from './components/UserLogin';
import TabHeader from './components/TabHeader';
import LeaderboardTab from './components/LeaderBoardTab';
import ModulesTab from './components/ModulesTab';
import AvatarPopup from './components/AvatarPopup';

import { useAuth } from './context/AuthContext';
import { leaderBoardService, userService } from './api/api';
import MapScene from './game/scenes/MapScene';

import './App.css';
import FloatingButtons from './components/FloatingButtons';

// Configurable constants
const CONFIG = {
  DEFAULT_AVATAR: 'avatar1.png',
  ROUTES: {
    HOME: '/',
    DASHBOARD: '/game-dashboard',
  },
  LOCAL_KEYS: {
    AVATAR: 'avatar',
    TASK_LIST: 'taskList',
    COMPLETED: 'completedTasks',
    TOTAL: 'totalTasks',
    PLAYER_X: 'playerX',
    PLAYER_Y: 'playerY',
  },
};

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
  const [avatar, setAvatar] = useState(() => localStorage.getItem(CONFIG.LOCAL_KEYS.AVATAR) || CONFIG.DEFAULT_AVATAR);

  useEffect(() => {
    const storedTasks = localStorage.getItem(CONFIG.LOCAL_KEYS.TASK_LIST);
    const storedCompleted = localStorage.getItem(CONFIG.LOCAL_KEYS.COMPLETED);
    const storedTotal = localStorage.getItem(CONFIG.LOCAL_KEYS.TOTAL);

    if (storedTasks) {
      const parsed = JSON.parse(storedTasks);
      setTaskList(parsed);
      setCompletedTasks(Number(storedCompleted) || 0);
      setTotalTasks(Number(storedTotal) || 0);
    }
  }, []);

  const handleUserIdSubmit = ({ soeid, mappedModules, avatarExists }) => {
    localStorage.removeItem(CONFIG.LOCAL_KEYS.PLAYER_X);
    localStorage.removeItem(CONFIG.LOCAL_KEYS.PLAYER_Y);

    setModulesList(mappedModules);
    const taskList = mappedModules[0]?.taskZones || [];
    const completed = taskList.filter(task => task.completed).length;

    setTaskList(taskList);
    setCompletedTasks(completed);
    setTotalTasks(taskList.length);

    localStorage.setItem(CONFIG.LOCAL_KEYS.TASK_LIST, JSON.stringify(taskList));
    localStorage.setItem(CONFIG.LOCAL_KEYS.COMPLETED, completed);
    localStorage.setItem(CONFIG.LOCAL_KEYS.TOTAL, taskList.length);

    userService.getUserDetails(soeid)
      .then(res => {
        const fetchedAvatar = res.data.avatar || CONFIG.DEFAULT_AVATAR;
        setAvatar(fetchedAvatar);
        localStorage.setItem(CONFIG.LOCAL_KEYS.AVATAR, fetchedAvatar);
      })
      .catch(err => {
        console.warn('Error fetching avatar:', err);
        setAvatar(CONFIG.DEFAULT_AVATAR);
        localStorage.setItem(CONFIG.LOCAL_KEYS.AVATAR, CONFIG.DEFAULT_AVATAR);
      });

    if (!avatarExists) {
      setShowAvatarPopup(true);
    }
  };

  useEffect(() => {
    if (!user || taskList.length === 0 || activeTab !== 'modules') return;

    const container = document.getElementById('phaser-container');
    if (!container) return;

    const gameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: window.innerWidth,
      height: window.innerHeight,
      scene: [],
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
    };

    const lastX = Number(localStorage.getItem(CONFIG.LOCAL_KEYS.PLAYER_X)) || 100;
    const lastY = Number(localStorage.getItem(CONFIG.LOCAL_KEYS.PLAYER_Y)) || 160;

    const mapScene = new MapScene({
      onTaskTrigger: (zone) => setModalTask(zone),
      onProgressUpdate: (completed, total) => {
        setCompletedTasks(completed);
        setTotalTasks(total);
        localStorage.setItem(CONFIG.LOCAL_KEYS.COMPLETED, completed);
        localStorage.setItem(CONFIG.LOCAL_KEYS.TOTAL, total);
      },
      initialTasks: taskList,
      user,
      initialPlayerX: lastX,
      initialPlayerY: lastY,
      avatar,
    });

    const game = new Phaser.Game(gameConfig);
    game.scene.add('MapScene', mapScene, true);
    setPhaserGame(game);

    const resizeHandler = () => game.scale.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      game.destroy(true);
    };
  }, [user, taskList, activeTab, avatar]);

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
          const sorted = res.data
            .map((user, index) => ({
              rank: index + 1,
              soeid: user.soeid,
              score: user.score,
              fullName: user.full_name,
              avatar: user.avatar,
              location: user.location,
              grade: user.grade,
            }))
            .sort((a, b) => b.score - a.score);

          setLeaderboardData(sorted);
        })
        .catch(err => {
          console.error('Error fetching leaderboard:', err);
        });
    }
  }, [activeTab]);

  const handleClose = () => {
    setModalTask(null);
    const scene = phaserGame?.scene?.getScene('MapScene');
    scene?.setModalOpen(false);
  };

  const handleComplete = () => {
    if (phaserGame && modalTask) {
      const scene = phaserGame.scene.getScene('MapScene');
      scene.completeZone(modalTask);
    }
    setModalTask(null);
  };

  const renderActiveTabContent = () => (
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

  return (
    <>
      <Routes>
        <Route
          path={CONFIG.ROUTES.HOME}
          element={
            user ? (
              <Navigate to={CONFIG.ROUTES.DASHBOARD} />
            ) : (
              <UserLogin onLoginComplete={handleUserIdSubmit} />
            )
          }
        />
        <Route
          path={CONFIG.ROUTES.DASHBOARD}
          element={user ? renderActiveTabContent() : <Navigate to={CONFIG.ROUTES.HOME} />}
        />
      </Routes>
      {showAvatarPopup && (
        <AvatarPopup
          soeid={user}
          onAvatarSelected={(avatar) => {
            localStorage.setItem(CONFIG.LOCAL_KEYS.AVATAR, avatar);
            setAvatar(avatar);
            setShowAvatarPopup(false);
          }}
        />
      )}
      {user && <FloatingButtons />}
    </>
  );
}

export default App;