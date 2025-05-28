import React, { useEffect, useState } from 'react';
import TaskModal from './components/TaskModal';

function App() {
  const [modalTask, setModalTask] = useState<null | { title: string; contentUrl: string }>(null);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.task) setModalTask(e.detail.task);
    };
    window.addEventListener('show-task-modal', handler);
    return () => window.removeEventListener('show-task-modal', handler);
  }, []);

  const handleClose = () => setModalTask(null);
  const handleComplete = () => {
    window.dispatchEvent(new CustomEvent('task-completed', { detail: { title: modalTask?.title } }));
    setModalTask(null);
  };

  return (
    <>
      <div id="phaser-container"></div>
      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={handleClose}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}

export default App;