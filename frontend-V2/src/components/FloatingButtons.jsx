import React, { useState, useRef, useEffect } from 'react';
import './FloatingButtons.css';
import { CgMenuGridR } from "react-icons/cg";
import { PiLinkSimpleBold } from "react-icons/pi";

const FloatingButtons = () => {
    const [showResources, setShowResources] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const resourcesRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                resourcesRef.current &&
                !resourcesRef.current.contains(event.target) &&
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setShowResources(false);
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleResources = () => {
        setShowResources((prev) => {
            if (!prev) setShowMenu(false);
            return !prev;
        });
    };

    const toggleMenu = () => {
        setShowMenu((prev) => {
            if (!prev) setShowResources(false);
            return !prev;
        });
    };

    return (
        <div className="floating-buttons-container">
            <div className="floating-button-wrapper" ref={resourcesRef}>
                <button className="floating-button" onClick={toggleResources}>
                <PiLinkSimpleBold />
                </button>
                {showResources && (
                    <div className="popup-menu popup-resources popup-from-middle">
                        <ul>
                            <li><a href="https://example.com/resource1" target="_blank" rel="noreferrer">Resource 1</a></li>
                            <li><a href="https://example.com/resource2" target="_blank" rel="noreferrer">Resource 2</a></li>
                            <li><a href="https://example.com/resource3" target="_blank" rel="noreferrer">Resource 3</a></li>
                        </ul>
                    </div>
                )}
            </div>
            <div className="floating-button-wrapper" ref={menuRef}>
                <button className="floating-button" onClick={toggleMenu}>
                <CgMenuGridR />
                </button>
                {showMenu && (
                    <div className="popup-menu popup-menu-links popup-from-top">
                        <ul>
                            <li><a href="#modules">Modules</a></li>
                            <li><a href="#leaderboard">Leaderboard</a></li>
                            <li><a href="#profile">Profile</a></li>
                            <li><a href="#settings">Settings</a></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloatingButtons;