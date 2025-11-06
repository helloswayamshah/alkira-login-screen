import { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import useNavigation from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';

function SignupFlow() {
  const [currentPage, setCurrentPage] = useState('signup'); // 'signup' or 'success'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('')
  const roles = ['reader', 'writer'];
  const [role, setRole] = useState(roles[0]);
  const [error, setError] = useState(null);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email));
  };

  const validatePassword = (password) => {
    // Auth0 password requirements:
    // - At least 8 characters
    // - At least 1 lowercase letter
    // - At least 1 uppercase letter
    // - At least 1 number
    // - At least 1 special character
    const minLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasLowercase && hasUppercase && hasNumber && hasSpecial,
      minLength,
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSpecial
    };
  };

  const handleSignUp = async () => {
    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (firstName.trim() === "") {
      setError('Please enter your first name.');
      setTimeout(() => setError(null), 5000);
      return;
    }


    // Check role selection
    if (!role) {
      setError('Please select a role.');
      setTimeout(() => setError(null), 5000);
      return;
    }



    // If all validations pass, proceed to success page
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const response = await useApi('POST', '/api/signup', {}, { email, password, role, first_name: firstName, last_name: lastName });
    if (!response.ok) {
      const data = await response.json();
      console.log(data);
      setError(data.message || 'Signup failed. Please try again.');
      setTimeout(() => setError(null), 5000);
      return;
    } 
    setCurrentPage('success');
  };

  const passwordValidation = validatePassword(password);

  if (currentPage === 'success') {
    return (
      <div className="login-page flex justify-center mt-[15vh] align-items-center">
        <div className="signin-card rounded-3xl shadow-2xl w-full max-w-md p-8 h-fit bg-white">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>
          
          <div className="text-3xl font-bold text-center text-gray-900 mb-3">
            Account Created Successfully!
          </div>
          
          <div className="text-center text-gray-600 mb-8">
            Your Alkira account has been created.
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">Account Details:</div>
            <div className="text-sm font-semibold text-gray-900 mb-1">Email: {email}</div>
            <div className="text-sm font-semibold text-gray-900">Role: {role}</div>
          </div>

          <button
            // eslint-disable-next-line react-hooks/rules-of-hooks
            onClick={() => useNavigation('/')}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-4"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page flex justify-center mt-[10vh] align-items-center">
      <div className="signin-card rounded-3xl shadow-2xl w-full max-w-md p-8 h-fit bg-white">
        <div className="flex justify-center mb-4 max-w-xs mx-auto">
          <img src="/logo.png" alt="Alkira logo" className="w-full" />
        </div>
        
        <div className="text-2xl font-bold text-center text-gray-900">Create Account</div>
        <div className="text-center text-gray-500 mb-6">Please fill in the details to sign up.</div>
        
        <div className="login-form">
          {/* Email Input */}
          <div className="input-group mb-4">
            <label className="block text-lg font-semibold text-gray-900 mb-1">Email</label>
            <input
              type="email"
              name='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
            />
          </div>
          {/* Name Inputs */}
          <div className="name-group flex flex-row gap-8 mb-4">
          <div className='input-group mb-4'>
            <label className='block text-lg font-semibold text-gray-900 mb-1'>First Name</label>
            <input
              type="text"
              name='firstName'
              aria-label='firstName'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name..."
              className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all'
            />
          </div>

          <div className='input-group mb-4'>
            <label className='block text-lg font-semibold text-gray-900 mb-1'>Last Name</label>
            <input
              type="text"
              name='lastName'
              aria-label='lastName'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name..."
              className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all'
            />
          </div>
          </div>

          {/* Password Input */}
          <div className="password-group flex flex-row gap-8 mb-4">
          <div className="input-group">
            <label className="block text-lg font-semibold text-gray-900 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                name='password'
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {password && (
              <div className="mt-2 text-xs space-y-1">
                <div className={passwordValidation.minLength ? "text-green-600" : "text-gray-500"}>
                  ✓ At least 8 characters
                </div>
                <div className={passwordValidation.hasLowercase ? "text-green-600" : "text-gray-500"}>
                  ✓ One lowercase letter
                </div>
                <div className={passwordValidation.hasUppercase ? "text-green-600" : "text-gray-500"}>
                  ✓ One uppercase letter
                </div>
                <div className={passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}>
                  ✓ One number
                </div>
                <div className={passwordValidation.hasSpecial ? "text-green-600" : "text-gray-500"}>
                  ✓ One special character (!@#$%^&*...)
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="input-group mb-4">
            <label className="block text-lg font-semibold text-gray-900 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                name='confirmPassword'
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <div className="mt-1 text-xs text-red-500">Passwords do not match</div>
            )}
          </div>
          </div>

          {/* Role Selection */}
          <div className="input-group mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">Select Role</label>
            <div className="flex flex-row gap-4">
              {roles.map((r) => {
                return (
                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  aria-label={r}
                  name="role"
                  value={r}
                  checked={role === r}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-4 h-4 text-gray-900 border-gray-300"
                />
                <span className="ml-3 text-gray-900 font-medium">{r}</span>
              </label>
                )
})}
            </div>
          </div>
        </div>

        {error && <div className="text-red-500 text-center mb-4 text-sm">{error}</div>}

        {/* Sign Up Button */}
        <button
          onClick={handleSignUp}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-6"
        >
          Sign Up
        </button>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
          <button className="font-semibold text-gray-900 hover:underline" onClick={() => useNavigation('/')}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignupFlow;