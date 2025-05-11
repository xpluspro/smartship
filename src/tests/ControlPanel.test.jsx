import { render, screen, fireEvent } from '@testing-library/react';
import Joystick from '../components/ControlPanel/Joystick';
import SpeedControl from '../components/ControlPanel/SpeedControl';
import ArmControl from '../components/ControlPanel/ArmControl';

describe('Control Panel Components', () => {
  const mockSocket = {
    send: jest.fn(),
    readyState: WebSocket.OPEN
  };

  describe('Joystick', () => {
    test('renders joystick', () => {
      render(<Joystick socket={mockSocket} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('sends control commands', () => {
      render(<Joystick socket={mockSocket} />);
      const joystick = screen.getByRole('button');
      
      // 模拟拖拽
      fireEvent.mouseDown(joystick, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(joystick, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(joystick);
      
      expect(mockSocket.send).toHaveBeenCalled();
    });
  });

  describe('SpeedControl', () => {
    test('renders speed buttons', () => {
      render(<SpeedControl socket={mockSocket} />);
      expect(screen.getByText('停止')).toBeInTheDocument();
      expect(screen.getByText('低速')).toBeInTheDocument();
      expect(screen.getByText('中速')).toBeInTheDocument();
      expect(screen.getByText('高速')).toBeInTheDocument();
    });

    test('changes speed', () => {
      render(<SpeedControl socket={mockSocket} />);
      fireEvent.click(screen.getByText('停止'));
      expect(mockSocket.send).toHaveBeenCalled();
    });
  });

  describe('ArmControl', () => {
    test('renders arm control', () => {
      render(<ArmControl socket={mockSocket} />);
      expect(screen.getByText('控制臂')).toBeInTheDocument();
    });

    test('sends arm control commands', () => {
      render(<ArmControl socket={mockSocket} />);
      const armControl = screen.getByText('控制臂');
      
      // 模拟控制
      fireEvent.click(armControl);
      
      expect(mockSocket.send).toHaveBeenCalled();
    });
  });
}); 