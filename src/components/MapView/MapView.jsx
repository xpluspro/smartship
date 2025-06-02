import React, { useEffect, useRef, useState } from 'react';
import './MapView.css';

const MapView = ({ socket }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [trackPoints, setTrackPoints] = useState([]); // 存储轨迹点

  // 初始化地图
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // 加载高德地图脚本
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY}`;
    script.async = true;
    script.onload = () => {
      // 创建地图实例
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 13,
        center: [116.4074, 39.9042],
        viewMode: '3D'
      });

      // 创建标记 - 使用默认样式
      const marker = new window.AMap.Marker({
        position: [0, 0],
        offset: new window.AMap.Pixel(-8, -8),
        angle: 0, // 初始角度
        autoRotation: true // 自动旋转
      });

      // 创建轨迹线
      const polyline = new window.AMap.Polyline({
        path: [],
        strokeColor: '#3366FF',
        strokeWeight: 4,
        strokeOpacity: 0.8
      });

      marker.setMap(map);
      polyline.setMap(map);
      markerRef.current = marker;
      polylineRef.current = polyline;
      mapInstanceRef.current = map;
    };

    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      document.head.removeChild(script);
    };
  }, []);

  // 处理WebSocket消息
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'gps' && data.latitude && data.longitude) {
          const newPosition = [data.longitude, data.latitude];
          setPosition(newPosition);
          
          if (markerRef.current && mapInstanceRef.current) {
            // 更新标记位置
            markerRef.current.setPosition(newPosition);
            
            // 计算方向角度（如果有方向数据）
            if (data.heading) {
              markerRef.current.setAngle(data.heading);
            }

            // 更新轨迹
            const newTrackPoints = [...trackPoints, newPosition];
            setTrackPoints(newTrackPoints);
            if (polylineRef.current) {
              polylineRef.current.setPath(newTrackPoints);
            }

            // 自动跟随船只
            mapInstanceRef.current.setCenter(newPosition);
          }
        }
      } catch (err) {
        console.error('Error parsing GPS data:', err);
        setError('GPS数据解析错误');
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, trackPoints]);

  // 清除轨迹
  const handleClearTrack = () => {
    setTrackPoints([]);
    if (polylineRef.current) {
      polylineRef.current.setPath([]);
    }
  };

  return (
    <div className="map-view">
      <div className="map-container" ref={mapRef} />
      <div className="map-controls">
        <button 
          className="clear-track-button"
          onClick={handleClearTrack}
        >
          清除轨迹
        </button>
      </div>
      {position && (
        <div className="position-info">
          <p>纬度: {position[1].toFixed(6)}</p>
          <p>经度: {position[0].toFixed(6)}</p>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default MapView; 