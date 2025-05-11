import React, { useState, useEffect } from 'react';
import './ArmControl.css';

const ArmControl = ({ socket }) => {
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isDumping, setIsDumping] = useState(false);

  const handleGrab = () => {
    const newState = !isGrabbing;
    setIsGrabbing(newState);
    setIsDumping(false);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'control',
        command: 'arm',
        action: newState ? 'grab' : 'release'
      }));
    }
  };

  const handleDump = () => {
    const newState = !isDumping;
    setIsDumping(newState);
    setIsGrabbing(false);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'control',
        command: 'arm',
        action: newState ? 'dump' : 'reset'
      }));
    }
  };

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handleGrab();
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleDump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isGrabbing, isDumping]);

  return (
    <div className="arm-control">
      <h3>机械臂控制</h3>
      <div className="arm-buttons">
        <button
          className={`arm-button ${isGrabbing ? 'active' : ''}`}
          onClick={handleGrab}
        >
          {isGrabbing ? '释放' : '夹取'}
        </button>
        <button
          className={`arm-button ${isDumping ? 'active' : ''}`}
          onClick={handleDump}
        >
          {isDumping ? '复位' : '倾倒'}
        </button>
      </div>
      <div className="key-hint">
        <div>按 J 键切换夹取/释放</div>
        <div>按 K 键切换倾倒/复位</div>
      </div>
    </div>
  );
};

export default ArmControl; 