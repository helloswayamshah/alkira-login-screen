import { useContext } from 'react';
import LoginContext from '../context/loginContext';
import { useState, useEffect, useRef } from 'react';
import useNavigation from '../hooks/useNavigation';
import { useApi } from '../hooks/useApi';

function MfaCard() {
  const context = useContext(LoginContext);
  const { email } = context;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async () => {
    const enteredOtp = otp.join('');
    // Handle OTP submission logic here
    console.log('Entered OTP:', enteredOtp);
    if (enteredOtp.length < 6) {
      setError('Please enter a 6-digit code.');
      setTimeout(() => setError(null), 5000);
    } else {
      setError(null);
      // Proceed with OTP verification
      // You can call an API or perform further actions here
      try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const response = await useApi('POST', '/api/mfa-verify', {}, {
          mfa_token: context.mfaToken,
          otp: enteredOtp,
          oob_code: context.oobCode,
        });
        if (!response.ok) {
          const data = await response.json();
          if (data.status === 'invalid_grant') {
           setError('Invalid OTP. Please try again.');
          } else {
            setError(data.message || 'MFA verification failed. Please try again.');
          }
          setTimeout(() => setError(null), 5000);
          return;
        }
        const data = await response.json();
        if (data.status === 'ok') {
          // Handle successful MFA verification (e.g., store tokens, redirect)
          console.log('MFA verification successful:', data);
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
    }
  }

  const handleResend = async () => {
    // Handle resend OTP logic here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const response = await useApi('POST', '/api/resend-mfa', {}, {
      mfa_token: context.mfaToken,
    });

    if (response.ok) {
      setSuccess('OTP sent successfully.');
      setCanResend(false);
      setCountdown(30);
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError('Failed to resend OTP. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  function maskEmail(email) {
    // Split the email into the username and domain
    const parts = email.split('@');
    const username = parts[0];
    const domain = parts[1];

    // If the username is too short, return a fallback or handle as needed
    if (username.length <= 3) {
      return email;
    }

    // Get the first three characters of the username
    const firstThree = username.slice(0, 3);

    // Create a masked section with asterisks for the rest of the username
    const maskedUsername = firstThree + '*'.repeat(username.length - 3);

    // Return the combined masked email
    return maskedUsername + '@' + domain;
  }

  const maskedEmail = maskEmail(email);
  return (
    <div className="login-page flex justify-center mt-[15vh] align-items-center">
      <div className="signin-card rounded-3xl shadow-2xl w-full max-w-md p-8 h-fit">
        <div className='flex justify-center mb-4 max-w-xs mx-auto'>
          <img src='/logo.png' alt='Alkira logo' className='w-full'></img>
        </div>
        <div className='text-2xl font-bold text-center text-gray-900'>Enter Code</div>
        <div className='text-center text-gray-500 mb-8'>Please enter the 6 digit code sent to {maskedEmail}.</div>
        <div className='mfa-form flex justify-center gap-2'>
        {otp.map((value, index) => (
          <input
            key={index}
            name={`otp${index}`}
            ref={(el) => (inputRefs.current[index] = el)}
            type="numeric"
            maxLength="1"
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-14 h-16 text-center text-2xl font-semibold bg-transparent border-2 border-gray-300 rounded-lg "
          />
        ))}
        </div>
        {error && <div className='text-red-500 text-center mt-4'>{error}</div>}
        {success && <div className='text-green-500 text-center mt-4'>{success}</div>}
        <div className='text-center text-gray-500 mt-4 mb-6'>
          Didn't receive the code?{' '}
        {canResend ? (
            <button 
              onClick={handleResend}
              className='font-semibold text-blue-900 hover:underline'
            >
              Resend
            </button>
          ) : (
            <span className='font-semibold disabled text-gray-400'>
              Resend in {countdown}s
            </span>
          )}

        </div>
        <div className='flex justify-center mt-6'>
          <button
            onClick={handleSubmit}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            disabled={otp.some(digit => digit === '')}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

export default MfaCard;