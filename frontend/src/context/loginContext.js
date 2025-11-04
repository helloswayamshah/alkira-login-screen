import { createContext } from "react";

const LoginContext = createContext(
  {
    email: '',
    setEmail: () => {},
    password: '',
    setPassword: () => {},
    rememberMe: false,
    setRememberMe: () => {},
    currentPage: 'login',
    setCurrentPage: () => {},
    oobCode: '',
    setOobCode: () => {},
    mfaToken: '',
    setMfaToken: () => {},
  }
);

export default LoginContext;