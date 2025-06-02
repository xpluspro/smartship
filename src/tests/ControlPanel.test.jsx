import { render, screen, fireEvent } from '@testing-library/react';
import Joystick from '../components/ControlPanel/Joystick';
import SpeedControl from '../components/ControlPanel/SpeedControl';
import HatchControl from '../components/ControlPanel/ArmControl';

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
      expect(screen.getByText('低速')).toBeInTheDocument();
      expect(screen.getByText('中速')).toBeInTheDocument();
      expect(screen.getByText('高速')).toBeInTheDocument();
    });

    test('changes speed', () => {
      render(<SpeedControl socket={mockSocket} />);
      fireEvent.click(screen.getByText('低速'));
      expect(mockSocket.send).toHaveBeenCalled();
    });
  });

  describe('HatchControl', () => {
    test('renders hatch control', () => {
      render(<HatchControl socket={mockSocket} />);
      expect(screen.getByText('舱门控制')).toBeInTheDocument();
    });

    test('sends hatch control commands', () => {
      render(<HatchControl socket={mockSocket} />);
      const button = screen.getByRole('button');
      
      // 模拟点击开启
      fireEvent.click(button);
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'control',
        command: 'hatch',
        action: 'open'
      }));
      
      // 模拟点击关闭
      fireEvent.click(button);
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'control',
        command: 'hatch',
        action: 'close'
      }));
    });
  });
});