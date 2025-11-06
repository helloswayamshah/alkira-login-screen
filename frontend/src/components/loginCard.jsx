import { useContext, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import useNavigation from '../hooks/useNavigation';
import LoginContext from '../context/loginContext';
import { useApi } from '../hooks/useApi';

function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const context = useContext(LoginContext);
  const [error, setError] = useState(null);
  const { email, setEmail, password, setPassword, rememberMe, setRememberMe, setCurrentPage } = context;

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    console.log(re.test(String(email)));
    return re.test(String(email));
  };

  const handleSignIn = async () => {
    // Handle sign-in logic here
    // console.log('Email:', email);
    // console.log('Password:', password);
    // console.log('Remember Me:', rememberMe);
    // Send OTP and change page to OTP verification
    if (!validateEmail(email) || !password) {
      setError('Please enter valid email or password.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const response = await useApi('POST', '/api/login', {}, { email, password });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Login failed. Please try again.');
        setTimeout(() => setError(null), 5000);
        return;
      }
      const data = await response.json();
      if (data.status === 'mfa_required') {
        context.setMfaToken(data.mfa_token);
        context.setOobCode(data.oob_code);
        setCurrentPage('mfa');
      } else if (data.status === 'ok') {
        // Handle successful login (e.g., store tokens, redirect)
        console.log('Login successful:', data);
        // Redirect or update UI as needed
        localStorage.setItem('id_token', data.id_token);
        localStorage.setItem('access_token', data.access_token);
        // Redirect to dashboard or home page
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useNavigation('/dashboard');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      setTimeout(() => setError(null), 5000);
    }
  };


  return (
    <div className="login-page flex justify-center mt-[15vh] align-items-center">
      <div className="signin-card rounded-3xl shadow-2xl w-full max-w-md p-8 h-fit">
        <div className='flex justify-center mb-4 max-w-xs mx-auto'>
          <img src='/logo.png' alt='Alkira logo' className='w-full'></img>
        </div>
        <div className='text-2xl font-bold text-center text-gray-900'>Welcome Back</div>
        <div className='text-center text-gray-500 mb-8'>Please enter your details to sign in.</div>
        <div className='login-form'>
          <div className='input-group mb-4'>
            <label className='block text-lg font-semibold text-gray-900'>Email</label>
            <input
              type="email"
              name='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all'
            />
          </div>
          <div className='input-group mb-4'>
            <label className='block text-lg font-semibold text-gray-900'>Password</label>
            <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all pr-12'
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide Password" : "Show Password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            </div>
          </div>
        </div>
      {/* Remember Me & Forgot Password */}
        {/* <div className="flex items-center justify-between mt-2 mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border-2 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Remember me</span>
          </label>
        </div> */}
        {error && <div className='text-red-500 text-center mb-4'>{error}</div>}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-6"
        >
          Sign in
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account yet?{' '}
          {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
          <button className="font-semibold text-gray-900 hover:underline" onClick={() => {useNavigation('/signup')}}>
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginCard;