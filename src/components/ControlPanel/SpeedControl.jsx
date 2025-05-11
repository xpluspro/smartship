import React, { useState, useEffect } from 'react';
import './SpeedControl.css';

const SpeedControl = ({ socket }) => {
  const [speed, setSpeed] = useState(1); // 默认低速
  const speeds = [
    { value: 1, label: '低速' },
    { value: 2, label: '中速' },
    { value: 3, label: '高速' }
  ];

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'control',
        command: 'speed',
        value: newSpeed
      }));
    }
  };

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        const currentIndex = speeds.findIndex(s => s.value === speed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        handleSpeedChange(speeds[nextIndex].value);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [speed]);

  return (
    <div className="speed-control">
      <h3>速度控制</h3>
      <div className="speed-buttons">
        {speeds.map(({ value, label }) => (
          <button
            key={value}
            className={`speed-button ${speed === value ? 'active' : ''}`}
            onClick={() => handleSpeedChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="current-speed">
        当前速度: {speeds.find(s => s.value === speed)?.label}
        <div className="key-hint">按 S 键切换速度</div>
      </div>
    </div>
  );
};

export default SpeedControl; 