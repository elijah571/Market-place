import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Products from './pages/Products';
import Register from './User/Register';
import Login from './User/Login';
import Verify from './User/Verify';
import VerifyEmail from './User/VerifyEmail';

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/product/:id" element={<ProductDetails />}></Route>
          <Route path="/products" element={<Products />}></Route>
          <Route path="/products/:keywords" element={<Products />}></Route>
          <Route path="/signup" element={<Register />}></Route>
          <Route path="/login" element={<Login />}></Route>

          <Route path="/verify-email" element={<Verify />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
