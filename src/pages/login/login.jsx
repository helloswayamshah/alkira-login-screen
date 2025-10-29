import LoginCard from '../../components/loginCard';
import MfaCard from '../../components/mfaCard';
import { useState } from 'react';
import LoginContext from '../../context/loginContext';

function Login() {
  const [currPage, setCurrentPage] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  return (
    <LoginContext.Provider value={{
      email,
      setEmail,
      password,
      setPassword,
      rememberMe,
      setRememberMe,
      currPage,
      setCurrentPage
    }}>
    {currPage === 'login' ? <LoginCard setCurrentPage = {setCurrentPage} /> : <MfaCard />}
    </LoginContext.Provider>
  )
}

export default Login;