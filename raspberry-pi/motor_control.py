import RPi.GPIO as GPIO
import time

class MotorControl:
    def __init__(self):
        # 设置GPIO模式
        GPIO.setmode(GPIO.BCM)
        
        # 定义电机控制引脚
        self.motor_pins = {
            'left': {
                'enable': 12,     # 左电机PWM使能端
                'forward': 14,     # 正转控制端
                'backward': 15     # 反转控制端
            },
            'right': {
                'enable': 13,     # 右电机PWM使能端
                'forward': 2,    # 正转控制端
                'backward': 3    # 反转控制端
            }
        }
        
        # 速度档位设置（PWM占空比）
        self.speed_levels = {
            'left': {
                0: 0,     # 停止
                1: 30,    # 低速
                2: 60,    # 中速
                3: 90     # 高速
            },
            'right': {
                0: 0,     # 停止
                1: 30,    # 低速（比左电机快一点）
                2: 60,    # 中速（比左电机快一点）
                3: 90     # 高速（比左电机快一点）
            }
        }
        
        # 初始化所有引脚
        for motor in self.motor_pins.values():
            GPIO.setup(motor['enable'], GPIO.OUT)
            GPIO.setup(motor['forward'], GPIO.OUT)
            GPIO.setup(motor['backward'], GPIO.OUT)
            GPIO.output(motor['forward'], GPIO.LOW)
            GPIO.output(motor['backward'], GPIO.LOW)
        
        # 初始化PWM
        self.pwm_left = GPIO.PWM(self.motor_pins['left']['enable'], 100)  # 100Hz
        self.pwm_right = GPIO.PWM(self.motor_pins['right']['enable'], 100)  # 100Hz
        self.pwm_left.start(0)
        self.pwm_right.start(0)
        
        # 当前速度档位
        self.current_speed = 1

    def set_motor_direction(self, motor, direction):
        """设置电机方向
        motor: 'left' 或 'right'
        direction: 1 正转, -1 反转, 0 停止
        """
        pins = self.motor_pins[motor]
        if direction > 0:
            GPIO.output(pins['forward'], GPIO.HIGH)
            GPIO.output(pins['backward'], GPIO.LOW)
        elif direction < 0:
            GPIO.output(pins['forward'], GPIO.LOW)
            GPIO.output(pins['backward'], GPIO.HIGH)
        else:
            GPIO.output(pins['forward'], GPIO.LOW)
            GPIO.output(pins['backward'], GPIO.LOW)

    def set_speed_level(self, level):
        """设置速度档位（0-3）"""
        if level in self.speed_levels['left']:  # 使用left或right都可以，档位是一样的
            self.current_speed = level
            return True
        return False

    def control_motors(self, forward=False, left=False, right=False):
        """控制电机运动
        forward: 前进
        left: 左转
        right: 右转
        """
        if forward:
            # 前进时两个电机都转动
            self.set_motor_direction('left', 1)
            self.set_motor_direction('right', 1)
            self.pwm_left.ChangeDutyCycle(self.speed_levels['left'][self.current_speed])
            self.pwm_right.ChangeDutyCycle(self.speed_levels['right'][self.current_speed])
        elif left:
            # 左转时只有右电机转动
            self.set_motor_direction('left', 0)
            self.set_motor_direction('right', 1)
            self.pwm_left.ChangeDutyCycle(0)
            self.pwm_right.ChangeDutyCycle(self.speed_levels['right'][self.current_speed])
        elif right:
            # 右转时只有左电机转动
            self.set_motor_direction('left', 1)
            self.set_motor_direction('right', 0)
            self.pwm_left.ChangeDutyCycle(self.speed_levels['left'][self.current_speed])
            self.pwm_right.ChangeDutyCycle(0)
        else:
            # 停止
            self.stop()

    def stop(self):
        """停止所有电机"""
        self.set_motor_direction('left', 0)
        self.set_motor_direction('right', 0)
        self.pwm_left.ChangeDutyCycle(0)
        self.pwm_right.ChangeDutyCycle(0)

    def cleanup(self):
        """清理GPIO资源"""
        self.stop()
        self.pwm_left.stop()
        self.pwm_right.stop()
        GPIO.cleanup()

    def get_speed_level(self):
        """获取当前速度档位"""
        return self.current_speed