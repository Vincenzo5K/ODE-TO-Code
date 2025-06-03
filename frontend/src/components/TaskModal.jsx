import React, { useState, useEffect } from 'react';
import './TaskModal.css';

const TaskModal = ({ task, onClose, onComplete }) => {
    const [error, setError] = useState(false);

    useEffect(() => {
        // Prevent background scrolling when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const renderContent = () => {
        const url = task.contentUrl;

        if (!url) {
            return <div style={{ padding: '1rem', color: 'red' }}>No content available for this task.</div>;
        }

        if (error) {
            return (
                <div style={{ padding: '1rem', color: 'red' }}>
                    Failed to load content. Please check the link or try again later.
                </div>
            );
        }

        try {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                const videoId = videoIdMatch ? videoIdMatch[1] : '';
                return (
                    <iframe
                        width="100%"
                        height="400"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube Video"
                        frameBorder="0"
                        allowFullScreen
                        onError={() => setError(true)}
                    />
                );
            }

            if (url.endsWith('.mp4')) {
                return (
                    <video controls width="100%" onError={() => setError(true)}>
                        <source src={url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                );
            }

            if (url.endsWith('.pdf')) {
                return (
                    <iframe
                        src={url}
                        width="100%"
                        height="500"
                        title="PDF Viewer"
                        style={{ border: 'none' }}
                        onError={() => setError(true)}
                    />
                );
            }

            if (url.endsWith('.ppt') || url.endsWith('.pptx') || url.endsWith('.doc') || url.endsWith('.docx')) {
                return (
                    <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                        width="100%"
                        height="500"
                        title="Document Viewer"
                        style={{ border: 'none' }}
                        onError={() => setError(true)}
                    />
                );
            }

            if (url.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
                return (
                    <img
                        src={url}
                        alt={task.title}
                        style={{ maxWidth: '100%' }}
                        onError={() => setError(true)}
                    />
                );
            }

            return (
                <iframe
                    src={url}
                    width="100%"
                    height="500"
                    title="External Content"
                    style={{ border: 'none' }}
                    onError={() => setError(true)}
                />
            );
        } catch {
            setError(true);
            return null;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{task.title}</h2>
                <div className="modal-body">{renderContent()}</div>
                <div className="modal-actions">
                    <button onClick={onComplete} className="complete-button">
                        Mark Complete
                    </button>
                    <button onClick={onClose} className="close-button">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;