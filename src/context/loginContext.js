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
    setCurrentPage: () => {}
  }
);

export default LoginContext;