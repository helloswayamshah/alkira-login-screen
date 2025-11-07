import ResetCard from "../../components/resetCard";
import { useState } from "react";
import useNavigation from "../../hooks/useNavigation";

function Reset() {
  const [page, setPage] = useState('reset');
  return (
    <>
      {page === 'reset' && <ResetCard setPage={setPage} />}
      {page === 'confirmation' && (
        <div className="login-page flex justify-center mt-[15vh] align-items-center">
      <div className="signin-card rounded-3xl shadow-2xl w-full max-w-md p-8 h-fit">
        <div className='flex justify-center mb-4 max-w-xs mx-auto'>
          <img src='/logo.png' alt='Alkira logo' className='w-full'></img>
        </div>
        <div className='text-2xl font-bold text-center text-gray-900'>Check Your Email</div>
        <div className='text-center text-gray-500 mb-8'>We have sent a password reset link to your email address.</div>
        <button
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  onClick={() => useNavigation('/')}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-4"
                >
                  Go to Sign In
                </button>
      </div>
      
    </div> 
      )}
    </>
  );
}

export default Reset;