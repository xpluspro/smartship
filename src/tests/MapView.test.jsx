import { render, screen } from '@testing-library/react';
import MapView from '../components/MapView/MapView';

describe('MapView Component', () => {
  const mockSocket = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };

  test('renders map container', () => {
    render(<MapView socket={mockSocket} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  test('handles GPS updates', () => {
    render(<MapView socket={mockSocket} />);
    const mockGpsData = {
      type: 'gps',
      latitude: 39.9042,
      longitude: 116.4074
    };
    
    // 模拟WebSocket消息
    const messageHandler = mockSocket.addEventListener.mock.calls[0][1];
    messageHandler({ data: JSON.stringify(mockGpsData) });
    
    expect(screen.getByText(/纬度: 39.904200/)).toBeInTheDocument();
    expect(screen.getByText(/经度: 116.407400/)).toBeInTheDocument();
  });
}); 