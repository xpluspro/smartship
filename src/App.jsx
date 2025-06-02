import React, { useState, useEffect, useRef, useCallback } from 'react';
import Login from './components/Login/Login';
import VideoMonitor from './components/VideoMonitor/VideoMonitor';
import MapView from './components/MapView/MapView';
import Joystick from './components/ControlPanel/Joystick';
import SpeedControl from './components/ControlPanel/SpeedControl';
import HatchControl from './components/ControlPanel/ArmControl';
import DirectionControl from './components/ControlPanel/DirectionControl';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const heartbeatIntervalRef = useRef(null);
  const socketRef = useRef(null); // 添加socket引用

  // 发送心跳包的函数 - 使用ref确保获取最新的socket
  const sendHeartbeat = useCallback(() => {
    const currentSocket = socketRef.current;
    console.log('尝试发送心跳包, socket状态:', currentSocket?.readyState); // 添加状态调试
    
    if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
      try {
        const heartbeatMessage = JSON.stringify({ type: 'heartbeat' });
        currentSocket.send(heartbeatMessage);
        console.log('心跳包发送成功');
      } catch (error) {
        console.error('发送心跳包失败:', error);
      }
    } else {
      console.log('WebSocket未连接或状态异常，readyState:', currentSocket?.readyState);
    }
  }, []);

  // 启动心跳机制
  const startHeartbeat = useCallback(() => {
    console.log('清理旧的心跳定时器');
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    console.log('启动心跳机制，间隔10秒');
    
    // 先立即发送一次心跳包，延迟确保连接稳定
    setTimeout(() => {
      console.log('发送首次心跳包');
      sendHeartbeat();
    }, 500);
    
    // 每10秒发送一次心跳包
    heartbeatIntervalRef.current = setInterval(() => {
      console.log('定时器触发，发送心跳包');
      sendHeartbeat();
    }, 10000);
    
  }, [sendHeartbeat]);

  // 停止心跳机制
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const handleConnect = (newSocket) => {
    console.log('建立连接，设置socket引用');
    setSocket(newSocket);
    socketRef.current = newSocket; // 同时更新ref
    setIsConnected(true);
    
    // 确保socket完全打开后再启动心跳
    setTimeout(() => {
      console.log('延迟启动心跳机制');
      startHeartbeat();
    }, 200);

    // 添加断线重连机制
    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      socketRef.current = null; // 清除ref
      stopHeartbeat();
      reconnect();
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      newSocket.close();
    };
  };

  // 断线重连函数
  const reconnect = useCallback(() => {
    if (ip && port) {
      console.log('Attempting to reconnect...');
      const ws = new WebSocket(`ws://${ip}:${port}`);
      
      ws.onopen = () => {
        console.log('重连成功');
        handleConnect(ws);
      };
      
      ws.onerror = (error) => {
        console.error('重连失败:', error);
      };
    }
  }, [ip, port]);

  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (socket) {
        socket.close();
      }
    };
  }, [socket, stopHeartbeat]);

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
                    console.log(`尝试连接到 ws://${ip}:${port}`);
                    const ws = new WebSocket(`ws://${ip}:${port}`);
                    
                    ws.onopen = () => {
                      console.log('WebSocket连接已建立');
                      handleConnect(ws);
                    };
                    
                    ws.onerror = (error) => {
                      console.error('WebSocket连接错误:', error);
                      alert('连接失败，请检查IP和端口');
                    };
                    
                    ws.onclose = (event) => {
                      console.log('WebSocket连接关闭:', event);
                    };
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
                    stopHeartbeat();
                    socket.close();
                    setSocket(null);
                    socketRef.current = null; // 清除ref
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
              <HatchControl socket={socket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;