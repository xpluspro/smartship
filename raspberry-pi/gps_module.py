import serial
import pynmea2
import time

class GPSModule:
    def __init__(self, port="/dev/ttyUSB0", baudrate=9600):
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
            print("GPS connected")
        except Exception as e:
            print(f"GPS connection error: {e}")
            self.serial = None

    def get_current_position(self):
        if not self.serial:
            return "0,0"  # 返回默认值

        try:
            while True:
                newdata = self.serial.readline().decode('ascii', errors='replace')
                if newdata[0:6] == "$GNRMC":
                    newmsg = pynmea2.parse(newdata)
                    lat = newmsg.latitude
                    lng = newmsg.longitude
                    print(f"{lat},{lng}")
                    return f"{lat},{lng}"
        except Exception as e:
            print(f"GPS reading error: {e}")
            return "0,0"

    def cleanup(self):
        if self.serial:
            self.serial.close() 