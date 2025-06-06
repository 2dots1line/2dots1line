'use client';

import React, { useState, FormEvent } from 'react';

import { GlassmorphicPanel, GlassButton, InputField, ErrorMessage } from '@2dots1line/ui-components';

import { useUserStore } from '../../stores/UserStore';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const { signup, isLoading, error, clearError } = useUserStore();

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

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

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

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      console.log('SignupModal - Attempting signup with:', formData.email);
      await signup(formData.email, formData.password, formData.name);
      console.log('SignupModal - Signup successful, closing modal');
      // Close modal on successful signup
      onClose();
      // Reset form
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setValidationErrors({});
    } catch (err) {
      // Error is handled by the store
      console.error('SignupModal - Signup failed:', err);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
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
            Begin Your Journey
          </h2>
          <p className="text-onSurface/70">
            Create an account to start exploring
          </p>
        </div>

        {/* Error Display */}
        <ErrorMessage message={error || ''} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <InputField
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your full name"
            error={validationErrors.name}
            disabled={isLoading}
          />

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
            placeholder="Create a password"
            error={validationErrors.password}
            disabled={isLoading}
          />

          {/* Confirm Password Field */}
          <InputField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            error={validationErrors.confirmPassword}
            disabled={isLoading}
          />

          {/* Submit Button */}
          <GlassButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            loadingText="Creating Account..."
            className="w-full"
          >
            Create Account
          </GlassButton>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center">
          <p className="text-onSurface/70">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
              disabled={isLoading}
            >
              Sign in
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

export default SignupModal; 