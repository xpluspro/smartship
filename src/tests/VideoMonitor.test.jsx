import { render, screen, fireEvent } from '@testing-library/react';
import VideoMonitor from '../components/VideoMonitor/VideoMonitor';

describe('VideoMonitor Component', () => {
  const mockSocket = {
    send: jest.fn(),
    readyState: WebSocket.OPEN
  };

  test('renders video player', () => {
    render(<VideoMonitor socket={mockSocket} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('handles stream URL input', () => {
    render(<VideoMonitor socket={mockSocket} />);
    const urlInput = screen.getByRole('textbox');
    fireEvent.change(urlInput, { target: { value: 'http://example.com/stream' } });
    expect(urlInput.value).toBe('http://example.com/stream');
  });

  test('toggles AI detection', () => {
    render(<VideoMonitor socket={mockSocket} />);
    const aiToggle = screen.getByRole('checkbox');
    fireEvent.click(aiToggle);
    expect(aiToggle.checked).toBe(true);
  });
}); 