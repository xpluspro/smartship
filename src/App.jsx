import React, { useState } from 'react';
import Login from './components/Login/Login';
import VideoMonitor from './components/VideoMonitor/VideoMonitor';
import MapView from './components/MapView/MapView';
import Joystick from './components/ControlPanel/Joystick';
import SpeedControl from './components/ControlPanel/SpeedControl';
import ArmControl from './components/ControlPanel/ArmControl';
import DirectionControl from './components/ControlPanel/DirectionControl';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');

  const handleConnect = (newSocket) => {
    setSocket(newSocket);
    setIsConnected(true);
  };

  return (
    <div className="app">
      <div className="main-interface">
        <div className="header">
          <h1>智能打捞船控制系统</h1>
          <div className="connection-status">
            {!isConnected ? (
              <div className="login-form">
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="IP地址"
                />
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="端口"
                />
                <button 
                  onClick={() => {
                    const ws = new WebSocket(`ws://${ip}:${port}`);
                    ws.onopen = () => handleConnect(ws);
                    ws.onerror = () => alert('连接失败，请检查IP和端口');
                  }}
                >
                  连接
                </button>
              </div>
            ) : (
              <div className="status-connected">
                已连接到 {ip}:{port}
                <button 
                  onClick={() => {
                    socket.close();
                    setSocket(null);
                    setIsConnected(false);
                  }}
                >
                  断开连接
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="interface-grid">
          <div className="video-section">
            <VideoMonitor socket={socket} />
          </div>
          <div className="map-section">
            <MapView socket={socket} />
          </div>
          <div className="control-section">
            <div className="control-group">
              <DirectionControl socket={socket} />
            </div>
            <div className="control-group">
              <SpeedControl socket={socket} />
            </div>
            <div className="control-group">
              <ArmControl socket={socket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 