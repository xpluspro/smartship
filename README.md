# 智能打捞船控制界面

## 项目说明
这是智能打捞船的网页控制界面，提供以下功能：
- 视频监控（支持AI检测）
- 地图定位
- 三方向操作杆控制
- 速度档位控制
- 机械臂控制
- 登录连接

## 技术栈
- React
- Socket.io-client
- Leaflet (地图)
- Video.js (视频流)
- TailwindCSS (样式)

## 开发环境设置
1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

```json:web-control/package.json
{
  "name": "ship-control",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.2",
    "leaflet": "^1.9.4",
    "video.js": "^8.10.0",
    "tailwindcss": "^3.3.0",
    "@roboflow/inference": "^1.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

现在创建raspberry-pi部分的基本结构：

```markdown:raspberry-pi/README.md
# 智能打捞船树莓派控制系统

## 项目说明
这是智能打捞船的树莓派控制系统，负责：
- GPS数据采集和传输
- 电机和舵机控制
- Socket通信服务

## 依赖要求
- Python 3.8+
- RPi.GPIO
- pynmea2
- pyserial

## 安装依赖
```bash
pip install -r requirements.txt
```

## 运行说明
1. 确保GPS模块正确连接
2. 确保电机和舵机正确连接
3. 运行主程序：
```bash
python main.py
```
```

```text:raspberry-pi/requirements.txt
RPi.GPIO==0.7.1
pynmea2==1.19.0
pyserial==3.5
```

```python:raspberry-pi/main.py
import socket
import threading
import time
from gps_module import GPSModule
from motor_control import MotorControl
from servo_control import ServoControl

class ShipController:
    def __init__(self):
        self.gps = GPSModule()
        self.motor = MotorControl()
        self.servo = ServoControl()
        self.server_socket = None
        self.running = False

    def start_server(self, host='0.0.0.0', port=5000):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.bind((host, port))
        self.server_socket.listen(1)
        self.running = True
        
        print(f"Server started on {host}:{port}")
        
        while self.running:
            try:
                client_socket, address = self.server_socket.accept()
                print(f"Connected to {address}")
                client_thread = threading.Thread(
                    target=self.handle_client,
                    args=(client_socket,)
                )
                client_thread.start()
            except Exception as e:
                print(f"Error: {e}")
                break

    def handle_client(self, client_socket):
        try:
            while self.running:
                # 接收控制命令
                data = client_socket.recv(1024).decode()
                if not data:
                    break
                
                # 处理控制命令
                self.process_command(data)
                
                # 发送GPS数据
                gps_data = self.gps.get_current_position()
                client_socket.send(gps_data.encode())
                
        except Exception as e:
            print(f"Client error: {e}")
        finally:
            client_socket.close()

    def process_command(self, command):
        # TODO: 实现命令处理逻辑
        pass

    def cleanup(self):
        self.running = False
        if self.server_socket:
            self.server_socket.close()
        self.motor.cleanup()
        self.servo.cleanup()

if __name__ == "__main__":
    controller = ShipController()
    try:
        controller.start_server()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        controller.cleanup()
```

```python:raspberry-pi/gps_module.py
import serial
import pynmea2
import time

class GPSModule:
    def __init__(self, port="/dev/serial0", baudrate=9600):
        self.port = port
        self.baudrate = baudrate
        self.serial = None
        self.connect()

    def connect(self):
        try:
            self.serial = serial.Serial(
                self.port,
                baudrate=self.baudrate,
                timeout=0.5
            )
        except Exception as e:
            print(f"GPS connection error: {e}")
            self.serial = None

    def get_current_position(self):
        if not self.serial:
            return "0,0"  # 返回默认值

        try:
            while True:
                newdata = self.serial.readline().decode('ascii', errors='replace')
                if newdata[0:6] == "$GPRMC":
                    newmsg = pynmea2.parse(newdata)
                    lat = newmsg.latitude
                    lng = newmsg.longitude
                    return f"{lat},{lng}"
        except Exception as e:
            print(f"GPS reading error: {e}")
            return "0,0"

    def cleanup(self):
        if self.serial:
            self.serial.close()
``` 