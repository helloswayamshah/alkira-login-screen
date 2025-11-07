import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Home from './pages/home/home';
import Login from './pages/login/login';
import ProtectedRoute from './hooks/protectedRoute';
import Dashboard from './pages/dashboard/dashboard';
import Signup from './pages/signup/signup';
import Reset from './pages/reset/reset';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<Reset />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
