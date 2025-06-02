import React, { useState, useEffect } from 'react';
import './ArmControl.css';

const HatchControl = ({ socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOperating, setIsOperating] = useState(false); // 添加操作状态

  const handleToggle = () => {
    // 如果正在操作中，则禁止新的操作
    if (isOperating) {
      console.log('舱门正在操作中，请等待...');
      return;
    }

    const newState = !isOpen;
    setIsOpen(newState);
    setIsOperating(true); // 设置为操作中状态
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'control',
        command: 'hatch',
        action: newState ? 'open' : 'close'
      }));
    }

    // 模拟舵机操作时间（0.8秒），加上一点缓冲时间
    setTimeout(() => {
      setIsOperating(false);
      console.log(`舱门${newState ? '开启' : '关闭'}完成`);
    }, 1500); // 1秒后允许新的操作
  };

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isOperating]); // 添加isOperating依赖

  return (
    <div className="arm-control">
      <h3>舱门控制</h3>
      <div className="arm-buttons single-button">
        <button
          className={`arm-button ${isOpen ? 'active' : ''} ${isOperating ? 'operating' : ''}`}
          onClick={handleToggle}
          disabled={isOperating} // 操作期间禁用按钮
        >
          {isOperating 
            ? (isOpen ? '开启中...' : '关闭中...') 
            : (isOpen ? '关闭' : '开启')
          }
        </button>
      </div>
      <div className="key-hint">
        <div>按 H 键切换舱门开关</div>
        {isOperating && <div className="operation-hint">操作中，请稍候...</div>}
      </div>
    </div>
  );
};

export default HatchControl;