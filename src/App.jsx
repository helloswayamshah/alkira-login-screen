import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Home from './pages/home/home';
import Login from './pages/login/login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/signup' element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
