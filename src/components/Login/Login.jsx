import React, { useState } from 'react';
import './Login.css';

const Login = ({ onConnect }) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsConnecting(true);

    try {
      // 验证IP地址格式
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        throw new Error('无效的IP地址格式');
      }

      // 验证端口号
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        throw new Error('端口号必须在1-65535之间');
      }

      // 尝试建立Socket连接
      const socket = new WebSocket(`ws://${ip}:${port}`);
      
      socket.onopen = () => {
        setIsConnecting(false);
        onConnect(socket);
      };

      socket.onerror = (error) => {
        throw new Error('连接失败，请检查IP和端口是否正确');
      };

    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>智能打捞船控制系统</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ip">IP地址</label>
            <input
              type="text"
              id="ip"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="例如：192.168.1.100"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="port">端口</label>
            <input
              type="text"
              id="port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="例如：5000"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="connect-button"
            disabled={isConnecting}
          >
            {isConnecting ? '连接中...' : '连接'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 