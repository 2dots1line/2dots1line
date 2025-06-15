import type { Meta, StoryObj } from '@storybook/react';
import GlassmorphicPanel from './GlassmorphicPanel';

const meta: Meta<typeof GlassmorphicPanel> = {
  title: 'Components/GlassmorphicPanel',
  component: GlassmorphicPanel,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gradient',
      values: [
        {
          name: 'gradient',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          name: 'dark',
          value: '#333333',
        },
        {
          name: 'light',
          value: '#f0f0f0',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    opacity: {
      control: { type: 'range', min: 5, max: 25, step: 1 },
      description: 'Background opacity (percentage)',
    },
    blur: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Backdrop blur intensity',
    },
    border: {
      control: 'boolean',
      description: 'Show border',
    },
    borderOpacity: {
      control: { type: 'range', min: 10, max: 50, step: 5 },
      description: 'Border opacity (percentage)',
    },
    rounded: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'],
      description: 'Border radius',
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Internal padding',
    },
    shadow: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Drop shadow intensity',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">Default Panel</h3>
        <p className="text-gray-200">
          This is a glassmorphic panel with default settings. Notice the blur effect,
          semi-transparent background, and subtle border.
        </p>
      </div>
    ),
  },
};

export const HighOpacity: Story = {
  args: {
    opacity: 20,
    blur: 'lg',
    borderOpacity: 30,
    children: (
      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">High Opacity Panel</h3>
        <p className="text-gray-200">
          This panel has higher opacity and stronger blur for more prominence.
        </p>
      </div>
    ),
  },
};

export const MinimalBlur: Story = {
  args: {
    opacity: 5,
    blur: 'sm',
    borderOpacity: 15,
    shadow: 'sm',
    children: (
      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">Minimal Blur Panel</h3>
        <p className="text-gray-200">
          Subtle effect with minimal blur and low opacity for background content visibility.
        </p>
      </div>
    ),
  },
};

export const NoBorder: Story = {
  args: {
    border: false,
    opacity: 15,
    blur: 'xl',
    children: (
      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">Borderless Panel</h3>
        <p className="text-gray-200">
          Clean panel without border, relying purely on blur and background for definition.
        </p>
      </div>
    ),
  },
};

export const InteractiveCard: Story = {
  args: {
    opacity: 12,
    blur: 'md',
    rounded: 'xl',
    padding: 'lg',
    shadow: 'xl',
    children: (
      <div>
        <h3 className="text-2xl font-bold mb-4 text-white">Interactive Card</h3>
        <p className="text-gray-200 mb-4">
          Example of a more substantial panel that could be used for cards or modal content.
        </p>
        <div className="flex gap-3">
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
            Action
          </button>
          <button className="bg-purple-500/30 hover:bg-purple-500/40 text-white px-4 py-2 rounded-lg transition-colors">
            Secondary
          </button>
        </div>
      </div>
    ),
  },
};

export const CompactPanel: Story = {
  args: {
    opacity: 8,
    blur: 'md',
    rounded: 'md',
    padding: 'sm',
    shadow: 'md',
    children: (
      <div className="text-center">
        <span className="text-white font-medium">Compact Panel</span>
      </div>
    ),
  },
}; 