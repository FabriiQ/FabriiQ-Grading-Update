import React from 'react';
import { render } from '@testing-library/react';

// Simple test to verify Jest setup
describe('Simple Test', () => {
  test('should render a simple component', () => {
    const TestComponent = () => <div>Hello World</div>;
    const { getByText } = render(<TestComponent />);
    expect(getByText('Hello World')).toBeInTheDocument();
  });
});
