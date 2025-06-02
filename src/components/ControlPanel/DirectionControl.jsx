import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DirectionControl.css';

const DirectionControl = ({ socket, onSpeedChange }) => {
  const [activeDirection, setActiveDirection] = useState(null); // 只记录当前激活的方向
  const activeDirectionRef = useRef(null);

  // 更新 ref 当状态改变时
  useEffect(() => {
    activeDirectionRef.current = activeDirection;
  }, [activeDirection]);

  // 发送控制命令
  const sendControlCommand = useCallback((direction) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const command = {
      type: 'control',
      command: 'direction',
      forward: direction === 'forward',
      left: direction === 'left',
      right: direction === 'right'
    };

    console.log('发送方向控制命令:', command); // 添加调试日志
    socket.send(JSON.stringify(command));
  }, [socket]);
  // 处理键盘按下
  const handleKeyDown = useCallback((e) => {
    let newDirection = null;
    
    if (['ArrowUp', 'w'].includes(e.key)) {
      newDirection = 'forward';
    } else if (['ArrowLeft', 'a'].includes(e.key)) {
      newDirection = 'left';
    } else if (['ArrowRight', 'd'].includes(e.key)) {
      newDirection = 'right';
    }
    
    if (newDirection && activeDirectionRef.current !== newDirection) {
      e.preventDefault();
      setActiveDirection(newDirection);
      sendControlCommand(newDirection);
    }
  }, [sendControlCommand]);

  // 处理键盘释放
  const handleKeyUp = useCallback((e) => {
    let releasedDirection = null;
    
    if (['ArrowUp', 'w'].includes(e.key)) {
      releasedDirection = 'forward';
    } else if (['ArrowLeft', 'a'].includes(e.key)) {
      releasedDirection = 'left';
    } else if (['ArrowRight', 'd'].includes(e.key)) {
      releasedDirection = 'right';
    }
    
    // 只有当前释放的键是当前激活的方向时，才停止运动
    if (releasedDirection && activeDirectionRef.current === releasedDirection) {
      e.preventDefault();
      setActiveDirection(null);
      sendControlCommand(null);
    }
  }, [sendControlCommand]);

  // 添加键盘事件监听 - 移除依赖项避免无限循环
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 组件卸载时发送停止命令
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);      // 确保组件卸载时停止所有电机
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'control',
          command: 'direction',
          forward: false,
          left: false,
          right: false
        }));
      }
    };
  }, [handleKeyDown, handleKeyUp, socket]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((direction) => {
    if (activeDirectionRef.current !== direction) {
      setActiveDirection(direction);
      sendControlCommand(direction);
    }
  }, [sendControlCommand]);

  // 处理鼠标释放
  const handleMouseUp = useCallback((direction) => {
    // 只有当前释放的是激活的方向时，才停止运动
    if (activeDirectionRef.current === direction) {
      setActiveDirection(null);
      sendControlCommand(null);
    }
  }, [sendControlCommand]);
  return (
    <div className="direction-control">
      <h3>方向控制</h3>
      <div className="direction-buttons">
        <button 
          className={`direction-button ${activeDirection === 'forward' ? 'active' : ''}`}
          onMouseDown={() => handleMouseDown('forward')}
          onMouseUp={() => handleMouseUp('forward')}
          onMouseLeave={() => handleMouseUp('forward')}
        >
          前进
        </button>
        <div className="horizontal-buttons">
          <button 
            className={`direction-button ${activeDirection === 'left' ? 'active' : ''}`}
            onMouseDown={() => handleMouseDown('left')}
            onMouseUp={() => handleMouseUp('left')}
            onMouseLeave={() => handleMouseUp('left')}
          >
            左转
          </button>
          <button 
            className={`direction-button ${activeDirection === 'right' ? 'active' : ''}`}
            onMouseDown={() => handleMouseDown('right')}
            onMouseUp={() => handleMouseUp('right')}
            onMouseLeave={() => handleMouseUp('right')}
          >
            右转
          </button>
        </div>
      </div>
      <div className="key-hint">
        方向键或WASD控制方向 (只能同时按一个方向)
      </div>
    </div>
  );
};

export default DirectionControl; 