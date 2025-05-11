import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoMonitor.css';

const VideoMonitor = ({ socket }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState('');

  // 初始化视频播放器
  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      playerRef.current = videojs(videoElement, {
        controls: true,
        fluid: true,
        responsive: true,
        autoplay: true,
        sources: [{
          src: streamUrl,
          type: 'application/x-mpegURL'
        }]
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [streamUrl]);

  const handleStreamUrlChange = (e) => {
    setStreamUrl(e.target.value);
  };

  return (
    <div className="video-monitor">
      <div className="video-controls">
        <div className="stream-input">
          <input
            type="text"
            value={streamUrl}
            onChange={handleStreamUrlChange}
            placeholder="输入视频流URL"
          />
        </div>
      </div>

      <div className="video-container">
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default VideoMonitor; 