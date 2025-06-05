import React from 'react';
import ProgressBar from './ProgressBar';
import TaskModal from './TaskModal';
import './ModulesTab.css';

const ModulesTab = ({
    completedTasks,
    totalTasks,
    modalTask,
    onCloseModal,
    onCompleteModal
}) => {
    return (
        <div className="modules-tab">
            <div className="progress-wrapper">
                <ProgressBar completed={completedTasks} total={totalTasks} />
            </div>
            <div id="phaser-container" />
            {modalTask && (
                <TaskModal
                    task={{ title: modalTask.name, contentUrl: modalTask.contentUrl }}
                    onClose={onCloseModal}
                    onComplete={onCompleteModal}
                />
            )}
        </div>
    );
};

export default ModulesTab;