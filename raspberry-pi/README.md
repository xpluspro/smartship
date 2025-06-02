import RPi.GPIO as GPIO
import time

class ServoControl:
    def __init__(self, pin=24):
        GPIO.setmode(GPIO.BCM)
        self.pin = pin
        GPIO.setup(self.pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.pin, 50)  # 50Hz
        self.pwm.start(0)
        self.current_angle = 90  # 初始位置

    def set_angle(self, angle):
        # 限制角度范围
        angle = max(0, min(180, angle))
        
        # 计算占空比
        duty = angle / 18 + 2.5
        
        # 设置PWM
        self.pwm.ChangeDutyCycle(duty)
        self.current_angle = angle
        
        # 等待舵机转动到位
        time.sleep(0.3)

    def grab(self):
        self.set_angle(0)  # 夹取位置

    def release(self):
        self.set_angle(180)  # 释放位置

    def cleanup(self):
        self.pwm.stop()
        GPIO.cleanup() 