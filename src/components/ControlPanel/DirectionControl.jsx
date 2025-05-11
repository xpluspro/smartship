import React, { useState, useEffect } from 'react';
import './DirectionControl.css';

const DirectionControl = ({ socket, onSpeedChange }) => {
  const [pressedKeys, setPressedKeys] = useState(new Set());

  // 处理键盘按下
  const handleKeyDown = (e) => {
    if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'w', 'a', 'd'].includes(e.key)) {
      e.preventDefault();
      const newPressedKeys = new Set(pressedKeys);
      newPressedKeys.add(e.key);
      setPressedKeys(newPressedKeys);
      sendControlCommand(newPressedKeys);
    }
  };

  // 处理键盘释放
  const handleKeyUp = (e) => {
    if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'w', 'a', 'd'].includes(e.key)) {
      e.preventDefault();
      const newPressedKeys = new Set(pressedKeys);
      newPressedKeys.delete(e.key);
      setPressedKeys(newPressedKeys);
      sendControlCommand(newPressedKeys);
    }
  };

  // 发送控制命令
  const sendControlCommand = (keys) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const command = {
      type: 'control',
      command: 'direction',
      forward: keys.has('ArrowUp') || keys.has('w'),
      left: keys.has('ArrowLeft') || keys.has('a'),
      right: keys.has('ArrowRight') || keys.has('d')
    };

    socket.send(JSON.stringify(command));
  };

  // 添加键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressedKeys]);

  return (
    <div className="direction-control">
      <h3>方向控制</h3>
      <div className="direction-buttons">
        <button 
          className={`direction-button ${pressedKeys.has('ArrowUp') || pressedKeys.has('w') ? 'active' : ''}`}
          onMouseDown={() => handleKeyDown({ key: 'ArrowUp', preventDefault: () => {} })}
          onMouseUp={() => handleKeyUp({ key: 'ArrowUp', preventDefault: () => {} })}
          onMouseLeave={() => handleKeyUp({ key: 'ArrowUp', preventDefault: () => {} })}
        >
          前进
        </button>
        <div className="horizontal-buttons">
          <button 
            className={`direction-button ${pressedKeys.has('ArrowLeft') || pressedKeys.has('a') ? 'active' : ''}`}
            onMouseDown={() => handleKeyDown({ key: 'ArrowLeft', preventDefault: () => {} })}
            onMouseUp={() => handleKeyUp({ key: 'ArrowLeft', preventDefault: () => {} })}
            onMouseLeave={() => handleKeyUp({ key: 'ArrowLeft', preventDefault: () => {} })}
          >
            左转
          </button>
          <button 
            className={`direction-button ${pressedKeys.has('ArrowRight') || pressedKeys.has('d') ? 'active' : ''}`}
            onMouseDown={() => handleKeyDown({ key: 'ArrowRight', preventDefault: () => {} })}
            onMouseUp={() => handleKeyUp({ key: 'ArrowRight', preventDefault: () => {} })}
            onMouseLeave={() => handleKeyUp({ key: 'ArrowRight', preventDefault: () => {} })}
          >
            右转
          </button>
        </div>
      </div>
      <div className="key-hint">
        方向键或WASD控制方向
      </div>
    </div>
  );
};

export default DirectionControl; 