# video_streaming.py - 树莓派 CSI 摄像头视频流服务器（仅提供视频流）

from flask import Flask, Response
import cv2
import numpy as np
from picamera2 import Picamera2
import time

app = Flask(__name__)

# 初始化摄像头
picam2 = Picamera2()
# 设置预览配置（分辨率等）
preview_config = picam2.create_preview_configuration(main={"format": 'RGB888', "size": (800, 400)})
picam2.configure(preview_config)
# 开始视频捕获
picam2.start()

def generate_video():
    """生成视频帧的生成器函数"""
    while True:
        # 从摄像头获取帧
        frame = picam2.capture_array()
        
        # 将帧转换为适合网络传输的格式
        ret, jpeg = cv2.imencode('.jpg', frame)
        
        # 生成MJPEG流
        if ret:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')

@app.route('/video_feed')
def video_feed():
    """视频流路由"""
    return Response(generate_video(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("服务器启动在 0.0.0.0:8080/video_feed")
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)
