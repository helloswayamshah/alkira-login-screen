import { useState } from "react";
import { useApi } from "../hooks/useApi";

function ResetCard({setPage}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const handleReset = async () => {
    // Here you would typically handle the password reset logic,
    if (!email || !/\S+@\S+\.\S+/.test(email) || email.trim() === '') {
      setError('Please enter a valid email address.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const response = await useApi('POST', '/api/reset-password', {}, { email });
    if (response.ok) {
      console.log(`Password reset link sent to ${email}`);
      setPage('confirmation');
    } else {
      console.log(response);
      console.log('Failed to send password reset link.');
      setError('Failed to send password reset link. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };
  return (
    <div className="login-page flex justify-center mt-[15vh] align-items-center">
      <div className="signin-card rounded-3xl shadow-2xl w-full max-w-md p-8 h-fit">
        <div className='flex justify-center mb-4 max-w-xs mx-auto'>
          <img src='/logo.png' alt='Alkira logo' className='w-full'></img>
        </div>
        <div className='text-2xl font-bold text-center text-gray-900'>Forgot Password</div>
        <div className='text-center text-gray-500 mb-8'>Please enter your details to reset password.</div>
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
        </div>
        {error && <div className='text-red-500 text-center mb-4'>{error}</div>}
        <button
          onClick={handleReset}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-6"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}

export default ResetCard;