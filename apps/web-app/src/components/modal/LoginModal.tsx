'use client';

import { InputField, GlassmorphicPanel, GlassButton, ErrorMessage } from '@2dots1line/ui-components';
import React, { useState, FormEvent } from 'react';

import { useUserStore } from '../../stores/UserStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const { login, isLoading, error, clearError } = useUserStore();

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear global error
    if (error) {
      clearError();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.log('LoginModal - Attempting login with:', formData.email);
      await login(formData.email, formData.password);
      console.log('LoginModal - Login successful, closing modal');
      // Close modal on successful login
      onClose();
      // Reset form
      setFormData({ email: '', password: '' });
      setValidationErrors({});
    } catch (err) {
      // Error is handled by the store
      console.error('LoginModal - Login failed:', err);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setValidationErrors({});
    clearError();
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <GlassmorphicPanel 
        variant="glass-panel"
        rounded="xl" 
        padding="lg"
        className="w-full max-w-md relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-brand text-2xl sm:text-3xl font-medium text-primary mb-2">
            Welcome Back
          </h2>
          <p className="text-onSurface/70">
            Sign in to continue your journey
          </p>
        </div>

        {/* Error Display */}
        <ErrorMessage message={error || ''} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <InputField
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            error={validationErrors.email}
            disabled={isLoading}
          />

          {/* Password Field */}
          <InputField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            error={validationErrors.password}
            disabled={isLoading}
          />

          {/* Submit Button */}
          <GlassButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            loadingText="Signing In..."
            className="w-full"
          >
            Sign In
          </GlassButton>
        </form>

        {/* Switch to Signup */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/70 text-center">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign up here
            </button>
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-onSurface/50 hover:text-onSurface transition-colors"
          disabled={isLoading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </GlassmorphicPanel>
    </div>
  );
};

export default LoginModal; 