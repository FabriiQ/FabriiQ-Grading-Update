import React from 'react';
import { render, screen } from '@testing-library/react';
import { withActivityEditorAdapter } from '../ActivityEditorAdapter';
import { MultipleChoiceActivity } from '../../../models/multiple-choice';

// Mock legacy editor component
interface MockEditorProps {
  activity: MultipleChoiceActivity;
  onChange: (activity: MultipleChoiceActivity) => void;
  className?: string;
}

const MockLegacyEditor: React.FC<MockEditorProps> = ({ activity, onChange }) => {
  return (
    <div data-testid="mock-editor">
      <h2>{activity.title}</h2>
      <p>{activity.description}</p>
      <button 
        onClick={() => onChange({ ...activity, title: 'Updated Title' })}
        data-testid="update-button"
      >
        Update
      </button>
    </div>
  );
};

// Create adapted component
const AdaptedEditor = withActivityEditorAdapter(MockLegacyEditor, 'multiple-choice');

describe('ActivityEditorAdapter', () => {
  it('should adapt legacy editor to work with config/onChange props', () => {
    const mockOnChange = jest.fn();
    const config = {
      title: 'Test Activity',
      description: 'Test Description',
    };

    render(
      <AdaptedEditor 
        config={config}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should initialize with default activity when no config provided', () => {
    const mockOnChange = jest.fn();

    render(
      <AdaptedEditor 
        config={undefined}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
    // Should show default title from createDefaultMultipleChoiceActivity
    expect(screen.getByText('New Multiple Choice Quiz')).toBeInTheDocument();
  });

  it('should call onChange with updated activity', () => {
    const mockOnChange = jest.fn();
    const config = {
      title: 'Test Activity',
      description: 'Test Description',
    };

    render(
      <AdaptedEditor 
        config={config}
        onChange={mockOnChange}
      />
    );

    const updateButton = screen.getByTestId('update-button');
    updateButton.click();

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Title'
      })
    );
  });
});
