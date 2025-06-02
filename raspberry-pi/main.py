import socket
import threading
import time
import json
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
        self.gps_update_interval = 1  # GPS数据更新间隔(秒)
        self.websocket_clients = {}  # 存储WebSocket连接状态

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
            # 初始化为非WebSocket连接
            self.websocket_clients[id(client_socket)] = False

            # 使用阻塞模式处理握手
            client_socket.setblocking(True)

            # 接收握手数据
            try:
                data = client_socket.recv(1024).decode()
                if not data:
                    print("Empty initial request")
                    return

                print("Received initial request")

                if "Upgrade: websocket" in data:
                    # 响应WebSocket握手请求
                    self._handle_websocket_handshake(client_socket, data)
                else:
                    print("Not a WebSocket connection request")
                    return

                # 确认握手成功
                if not self.websocket_clients.get(id(client_socket), False):
                    print("WebSocket handshake failed")
                    return

            except Exception as e:
                print(f"Error during handshake: {e}")
                return

            # 握手完成后切换到非阻塞模式
            client_socket.setblocking(False)

            # 创建并启动GPS发送线程
            gps_thread = threading.Thread(
                target=self.send_gps_periodically,
                args=(client_socket,)
            )
            gps_thread.daemon = True
            gps_thread.start()            # 上次接收数据的时间
            last_received = time.time()
            # 心跳超时时间（秒）- 设置为60秒，给前端10秒心跳间隔留足够的缓冲
            HEARTBEAT_TIMEOUT = 60

            # 处理控制命令
            while self.running:
                try:
                    try:
                        data = client_socket.recv(1024)
                        if data:
                            last_received = time.time()
                            try:                                # 使用WebSocket解码
                                message = self._decode_websocket_frame(data)
                                if message:
                                    print(f"收到消息: {message}")  # 调试输出
                                    try:
                                        # 尝试解析JSON
                                        parsed_message = json.loads(message)
                                        if parsed_message.get('type') == 'heartbeat':
                                            # 收到心跳包
                                            print("收到心跳包")
                                            continue
                                    except json.JSONDecodeError:
                                        # 如果不是JSON，也检查是否包含heartbeat字符串
                                        if "heartbeat" in message:
                                            print("收到心跳包")
                                            continue
                                    
                                    self.process_command(message)
                            except Exception as e:
                                print(f"Error processing message: {e}")
                                continue
                    except socket.error as e:
                        # 对于非阻塞socket，无数据时会抛出异常
                        if e.errno in [socket.errno.EAGAIN, socket.errno.EWOULDBLOCK]:
                            # 检查心跳超时
                            if time.time() - last_received > HEARTBEAT_TIMEOUT:
                                print("Connection timed out - no heartbeat")
                                break
                            time.sleep(0.01)  # 避免CPU过度使用
                            continue
                        else:
                            # 其他socket错误
                            print(f"Socket error while receiving: {e}")
                            break
                except Exception as e:
                    print(f"Error in message loop: {e}")
                    break

        except Exception as e:
            print(f"Client connection error: {e}")
        finally:
            # 清理连接状态
            client_id = id(client_socket)
            if client_id in self.websocket_clients:
                del self.websocket_clients[client_id]
            # 确保客户端套接字被关闭
            print("Closing client socket")
            try:
                client_socket.shutdown(socket.SHUT_RDWR)
            except:
                pass  # 忽略已关闭的套接字错误
            client_socket.close()

    def _handle_websocket_handshake(self, client_socket, request):
        """处理WebSocket握手请求"""
        import base64
        import hashlib

        try:
            # 提取Sec-WebSocket-Key
            key = None
            for line in request.split('\r\n'):
                if line.startswith('Sec-WebSocket-Key:'):
                    key = line.split(':')[1].strip()
                    break

            if not key:
                print("No WebSocket key found")
                return

            # 计算WebSocket接受密钥
            magic_string = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
            accept_key = base64.b64encode(
                hashlib.sha1((key + magic_string).encode()).digest()
            ).decode()

            # 构建WebSocket握手响应
            response = (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                f"Sec-WebSocket-Accept: {accept_key}\r\n"
                "\r\n"
            )

            # 发送握手响应
            client_socket.send(response.encode())

            # 标记为WebSocket连接
            self.websocket_clients[id(client_socket)] = True
            print("WebSocket handshake completed successfully")

        except Exception as e:
            print(f"Error in WebSocket handshake: {e}")
            self.websocket_clients[id(client_socket)] = False

    def send_gps_periodically(self, client_socket):
        """定期发送GPS数据的线程函数"""
        last_send_attempt = 0
        retry_count = 0
        MAX_RETRIES = 3

        try:
            while self.running:
                try:
                    current_time = time.time()
                    # 控制发送频率
                    if current_time - last_send_attempt < self.gps_update_interval:
                        time.sleep(0.1)
                        continue

                    last_send_attempt = current_time                    # 获取GPS数据
                    gps_data = self.gps.get_current_position()
                    if not gps_data or gps_data == "0,0":
                        continue

                    try:
                        # 解析GPS数据字符串为经纬度
                        lat_str, lng_str = gps_data.split(',')
                        latitude = float(lat_str)
                        longitude = float(lng_str)
                        
                        # 准备发送的数据 - 修改为前端期望的格式
                        data_to_send = {
                            'type': 'gps',
                            'latitude': latitude,
                            'longitude': longitude
                        }

                        # WebSocket数据封装 - 使用JSON格式
                        if self.websocket_clients.get(id(client_socket), False):
                            json_data = json.dumps(data_to_send)
                            send_data = self._encode_websocket_frame(json_data)
                        else:
                            send_data = json.dumps(data_to_send).encode()

                        # 发送数据
                        client_socket.send(send_data)
                        retry_count = 0  # 重置重试计数

                    except socket.error as e:
                        if e.errno in [socket.errno.EAGAIN, socket.errno.EWOULDBLOCK]:
                            # 发送缓冲区已满，等待一会再试
                            retry_count += 1
                            if retry_count >= MAX_RETRIES:
                                print("Max GPS send retries reached")
                                break
                            time.sleep(0.1)
                            continue
                        else:
                            print(f"Fatal error while sending GPS: {e}")
                            break

                    time.sleep(self.gps_update_interval)

                except Exception as e:
                    print(f"Error in GPS thread: {e}")
                    time.sleep(1)  # 错误发生时等待一段时间再继续

        except Exception as e:
            print(f"GPS thread fatal error: {e}")

        print("GPS sending thread terminated")

    def _encode_websocket_frame(self, message):
        """将消息编码为WebSocket帧"""
        # 简化的WebSocket帧编码，仅处理文本消息
        message_bytes = message.encode('utf-8')
        frame = bytearray()

        # 构建帧头部
        frame.append(0x81)  # FIN=1(最后一帧), OPCODE=1(文本帧)

        # 构建负载长度
        length = len(message_bytes)
        if length <= 125:
            frame.append(length)
        elif length <= 65535:
            frame.append(126)
            frame.extend(length.to_bytes(2, 'big'))
        else:
            frame.append(127)
            frame.extend(length.to_bytes(8, 'big'))

        # 添加消息内容
        frame.extend(message_bytes)
        return bytes(frame)

    def _decode_websocket_frame(self, data):
        """解码 WebSocket 数据帧"""
        try:
            # 第二个字节的后7位表示数据长度
            byte = data[1]
            payload_length = byte & 127
            mask_start = 2

            # 处理扩展长度
            if payload_length == 126:
                # 接下来的2个字节表示长度
                mask_start = 4
            elif payload_length == 127:
                # 接下来的8个字节表示长度
                mask_start = 10

            # 获取掩码键值
            masks = data[mask_start:mask_start + 4]
            data_start = mask_start + 4

            # 解码数据
            raw = bytearray()
            for i in range(len(data[data_start:])):
                raw.append(data[data_start + i] ^ masks[i % 4])

            # 转换为字符串
            decoded = raw.decode('utf-8')
            print(f"解码后的数据: {decoded}")  # 调试输出
            return decoded

        except Exception as e:
            print(f"解码WebSocket帧错误: {e}")
            return None

    def process_command(self, command):
        """处理收到的命令"""
        try:
            # 解析JSON命令
            parsed_command = json.loads(command)
            print(f"处理命令: {parsed_command}")            # 提取命令类型
            command_type = parsed_command.get('type')
            
            if command_type == 'heartbeat':
                # 处理心跳包
                print("收到心跳包")
                return  # 直接返回，不需要进一步处理
                
            elif command_type == 'control':
                command_action = parsed_command.get('command')
                
                if command_action == 'direction':
                    # 处理方向控制命令
                    forward = parsed_command.get('forward', False)
                    left = parsed_command.get('left', False)
                    right = parsed_command.get('right', False)
                    self.motor.control_motors(forward=forward, left=left, right=right)
                    print(f"方向控制 - 前进: {forward}, 左转: {left}, 右转: {right}")
                
                elif command_action == 'speed':
                    # 处理速度控制命令
                    speed_level = int(parsed_command.get('value', 0))
                    self.motor.set_speed_level(speed_level)
                    print(f"速度设置为档位 {speed_level}")
                
                elif command_action == 'hatch':
                    # 处理舱门控制命令
                    action = parsed_command.get('action')
                    if action == 'open':
                        print("打开舱门")
                        self.servo.open_hatch()
                    elif action == 'close':
                        print("关闭舱门")
                        self.servo.close_hatch()

            elif command_type == 'heartbeat':
                print("收到心跳包")
                
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            print(f"原始命令: {command}")
        except Exception as e:
            print(f"处理命令时出错: {e}")
            print(f"原始命令: {command}")    
    def cleanup(self):
        self.running = False
        if self.server_socket:
            self.server_socket.close()
        self.gps.cleanup()
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