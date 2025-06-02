import React, { useRef, useState } from 'react';
import './VideoMonitor.css';

const VideoMonitor = ({ socket }) => {
  const iframeRef = useRef(null); // 引用 iframe 元素
  const [streamUrl, setStreamUrl] = useState('http://192.168.137.178:8080/video_feed'); // 替换为实际 IP
  const [error, setError] = useState('');

  // 连接按钮点击事件
  const handleConnectClick = () => {
    if (!streamUrl) {
      setError('请输入有效的视频流 URL');
      return;
    }
    // 更新 iframe 的 src，触发重新加载
    if (iframeRef.current) {
      iframeRef.current.src = streamUrl;
      setError(''); // 清除之前的错误
    }
  };

  // 监听 iframe 加载错误
  const handleIframeError = (e) => {
    setError('视频流加载失败，请检查 URL 或网络连接');
    console.error('Iframe 错误:', e);
  };

  return (
    <div className="video-monitor">
      <div className="video-controls">
        <div className="stream-input">
          <input
            type="text"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="输入视频流 URL（如 http://192.168.1.100:8080/video_feed）"
          />
        </div>
        <button className="connect-button" onClick={handleConnectClick}>连接</button>
      </div>

      <div className="video-container">
        <iframe
          ref={iframeRef}
          src={streamUrl}
          frameBorder="0" // 移除边框
          width="108%" // 自适应宽度
          height="400px" // 设置固定高度（可根据需求调整）
          onError={handleIframeError} // 错误处理
          title="视频监控"
        />
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default VideoMonitor;