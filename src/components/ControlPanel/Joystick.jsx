import React, { useEffect, useRef, useState } from 'react';
import './Joystick.css';

const Joystick = ({ socket, onDirectionChange }) => {
  const joystickRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    const handleMouseDown = (e) => {
      setIsDragging(true);
      updatePosition(e);
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        updatePosition(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      resetPosition();
    };

    const updatePosition = (e) => {
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const x = e.clientX - rect.left - centerX;
      const y = e.clientY - rect.top - centerY;
      
      // 计算距离中心的距离
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = centerX;
      
      // 如果超出范围，进行归一化
      const normalizedX = distance > maxDistance ? (x / distance) * maxDistance : x;
      const normalizedY = distance > maxDistance ? (y / distance) * maxDistance : y;
      
      setPosition({ x: normalizedX, y: normalizedY });
      
      // 计算方向值（-1到1之间）
      const directionX = normalizedX / maxDistance;
      const directionY = normalizedY / maxDistance;
      
      setDirection({ x: directionX, y: directionY });
      
      // 发送控制命令
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'control',
          command: 'joystick',
          x: directionX,
          y: directionY
        }));
      }
      
      onDirectionChange?.({ x: directionX, y: directionY });
    };

    const resetPosition = () => {
      setPosition({ x: 0, y: 0 });
      setDirection({ x: 0, y: 0 });
      
      // 发送停止命令
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'control',
          command: 'joystick',
          x: 0,
          y: 0
        }));
      }
      
      onDirectionChange?.({ x: 0, y: 0 });
    };

    joystick.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      joystick.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, socket, onDirectionChange]);

  return (
    <div className="joystick-container">
      <div className="joystick" ref={joystickRef}>
        <div 
          className="joystick-knob"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`
          }}
        />
      </div>
      <div className="direction-indicator">
        <div>前进/后退: {Math.round(direction.y * 100)}%</div>
        <div>左转/右转: {Math.round(direction.x * 100)}%</div>
      </div>
    </div>
  );
};

export default Joystick; 