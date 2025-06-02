import RPi.GPIO as GPIO
import time

class ServoControl:
    def __init__(self, pin=18):  # 修改为GPIO18
        GPIO.setmode(GPIO.BCM)
        self.pin = pin
        GPIO.setup(self.pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.pin, 50)  # 50Hz
        self.pwm.start(0)
        self.current_angle = 90  # 初始位置（关闭）

    def set_angle(self, angle):
        # 设置PWM
        self.pwm.ChangeDutyCycle(angle)
        self.current_angle = angle
        
        # 等待舵机转动到位
        time.sleep(0.8)
        # 停止PWM输出，防止抖动
        self.pwm.ChangeDutyCycle(0)
    def open_hatch(self):
        self.set_angle(12)  # 完全打开位置

    def close_hatch(self):
        self.set_angle(2)    # 完全关闭位置

    def cleanup(self):
        self.pwm.stop()
        GPIO.cleanup()