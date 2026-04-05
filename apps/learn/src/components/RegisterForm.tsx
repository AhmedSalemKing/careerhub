import React, { useState } from 'react';

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country: string;
  city?: string;
  language?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  general?: string;
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    city: '',
    language: 'en',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateName = (name: string): boolean => {
    // Only letters and spaces, at least 2 chars
    const nameRegex = /^[a-zA-Z\u0600-\u06FF\s]{2,}$/;
    return nameRegex.test(name);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }

    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters and spaces (minimum 2 characters)';
    }

    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters and spaces (minimum 2 characters)';
    }

    // Phone validation (optional)
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please provide a valid phone number with country code';
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = 'Country is required';
    } else if (formData.country.length > 50) {
      newErrors.country = 'Country name is too long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      console.log('📤 Sending registration request:', formData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      console.log('📥 Registration response:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        // Store access token in memory
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          console.log('✅ Access token stored');
        }
      } else {
        // Handle backend validation errors
        if (response.status === 400) {
          setErrors({ general: data.message || 'Validation failed' });
        } else if (response.status === 409) {
          setErrors({ email: 'Email already exists' });
        } else {
          setErrors({ general: data.message || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h3>✅ Registration Successful!</h3>
        <p>Welcome to DeveWay! Your account has been created.</p>
        <button onClick={() => window.location.reload()}>
          Register Another Account
        </button>
      </div>
    );
  }

  return (
    <div className="register-form">
      <h2>Create Account</h2>
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
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        {/* First Name Field */}
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="John"
            disabled={isLoading}
          />
          {errors.firstName && <span className="error">{errors.firstName}</span>}
        </div>

        {/* Last Name Field */}
        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Doe"
            disabled={isLoading}
          />
          {errors.lastName && <span className="error">{errors.lastName}</span>}
        </div>

        {/* Phone Field (Optional) */}
        <div className="form-group">
          <label htmlFor="phone">Phone Number (Optional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+201234567890"
            disabled={isLoading}
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>

        {/* Country Field */}
        <div className="form-group">
          <label htmlFor="country">Country *</label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            placeholder="Egypt"
            disabled={isLoading}
          />
          {errors.country && <span className="error">{errors.country}</span>}
        </div>

        {/* City Field (Optional) */}
        <div className="form-group">
          <label htmlFor="city">City (Optional)</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Cairo"
            disabled={isLoading}
          />
        </div>

        {/* Language Field (Optional) */}
        <div className="form-group">
          <label htmlFor="language">Preferred Language (Optional)</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            disabled={isLoading}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        {/* General Error */}
        {errors.general && <div className="error general">{errors.general}</div>}

        {/* Submit Button */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
