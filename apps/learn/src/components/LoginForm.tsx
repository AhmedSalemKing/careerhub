import React, { useState } from 'react';

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log('📤 Sending login request:', { email: formData.email });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HTTP-only cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      console.log('📥 Login response:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        // Store access token in memory
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          console.log('✅ Access token stored');
          console.log('✅ User logged in:', data.data.user.email);
        }
      } else {
        // Handle backend errors
        if (response.status === 400) {
          setErrors({ general: data.message || 'Validation failed' });
        } else if (response.status === 401) {
          setErrors({ general: 'Invalid email or password' });
        } else {
          setErrors({ general: data.message || 'Login failed' });
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('❌ No access token found');
        return;
      }

      console.log('📤 Sending logout request');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Logout successful');
      } else {
        console.log('❌ Logout failed');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('accessToken');
      setSuccess(false);
      setFormData({ email: '', password: '' });
    }
  };

  const handleRefreshToken = async () => {
    try {
      console.log('📤 Sending refresh token request');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HTTP-only cookies
      });

      const data = await response.json();

      console.log('📥 Refresh response:', data);

      if (response.ok && data.success) {
        // Update access token in memory
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          console.log('✅ Access token refreshed');
        }
      } else {
        console.log('❌ Token refresh failed');
        // Clear invalid token
        localStorage.removeItem('accessToken');
        setSuccess(false);
      }
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      localStorage.removeItem('accessToken');
      setSuccess(false);
    }
  };

  const handleGetCurrentUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('❌ No access token found');
        return;
      }

      console.log('📤 Sending get current user request');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      console.log('📥 Current user response:', data);

      if (response.ok && data.success) {
        console.log('✅ Current user:', data.data.user);
      } else {
        console.log('❌ Failed to get current user');
      }
    } catch (error) {
      console.error('❌ Get current user error:', error);
    }
  };

  if (success) {
    return (
      <div className="logged-in-view">
        <h3>✅ Login Successful!</h3>
        <p>You are now logged in.</p>

        <div className="actions">
          <button onClick={handleGetCurrentUser}>Get Current User</button>
          <button onClick={handleRefreshToken}>Refresh Token</button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        <div className="debug-info">
          <h4>Debug Info:</h4>
          <p>Check browser console for detailed logs</p>
          <p>Access Token: {localStorage.getItem('accessToken') ? 'Stored' : 'Not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="user@example.com"
            disabled={isLoading}
            autoComplete="email"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password123!"
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        {/* General Error */}
        {errors.general && <div className="error general">{errors.general}</div>}

        {/* Submit Button */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="debug-info">
        <h4>Testing Info:</h4>
        <p>Backend URL: {process.env.NEXT_PUBLIC_API_URL || '(relative)'}</p>
        <p>Check browser console for request/response logs</p>
      </div>
    </div>
  );
};

export default LoginForm;
