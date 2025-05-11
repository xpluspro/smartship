import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../components/Login/Login';

describe('Login Component', () => {
  test('renders login form', () => {
    render(<Login onConnect={() => {}} />);
    expect(screen.getByLabelText(/IP地址/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/端口/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /连接/i })).toBeInTheDocument();
  });

  test('validates IP address format', () => {
    render(<Login onConnect={() => {}} />);
    const ipInput = screen.getByLabelText(/IP地址/i);
    const submitButton = screen.getByRole('button', { name: /连接/i });

    // 测试无效IP
    fireEvent.change(ipInput, { target: { value: 'invalid-ip' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/无效的IP地址格式/i)).toBeInTheDocument();

    // 测试有效IP
    fireEvent.change(ipInput, { target: { value: '192.168.1.100' } });
    fireEvent.click(submitButton);
    expect(screen.queryByText(/无效的IP地址格式/i)).not.toBeInTheDocument();
  });

  test('validates port number', () => {
    render(<Login onConnect={() => {}} />);
    const portInput = screen.getByLabelText(/端口/i);
    const submitButton = screen.getByRole('button', { name: /连接/i });

    // 测试无效端口
    fireEvent.change(portInput, { target: { value: '70000' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/端口号必须在1-65535之间/i)).toBeInTheDocument();

    // 测试有效端口
    fireEvent.change(portInput, { target: { value: '5000' } });
    fireEvent.click(submitButton);
    expect(screen.queryByText(/端口号必须在1-65535之间/i)).not.toBeInTheDocument();
  });
}); 