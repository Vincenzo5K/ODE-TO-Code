import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authService = {
    login: async (soeid) => api.post('/login', { soeid }),
    signup: async (soeid) => api.post('/user/create', { soeid }),
};

export const userService = {
    createUser: async (soeid) => api.post('/api/user/create', { soeid }),
    getAllTasks: async () => api.get('/api/tasks'),
    getUserTaskStatus: async (soeid) => api.get(`/api/user-tasks/${soeid}`),
    updateTaskStatus: async (soeid, taskName, completed) =>
        api.patch(`/api/user-tasks/${soeid}`, { task_name: taskName, completed }),
    getUserDetails: async (soeid) => api.get(`/api/user/${soeid}`),
    updateAvatar: async (soeid, avatar) => api.patch(`/api/user/${soeid}/avatar`, { avatar }),
    updateUserDetails: async (soeid, details) => api.patch(`/api/user/${soeid}/update`, details),
};

export const leaderBoardService = {
    getUserScores: async () => api.get('/api/user-scores/'),
};

export default api;