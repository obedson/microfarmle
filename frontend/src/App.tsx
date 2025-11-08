import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import Dashboard from './pages/Dashboard';
import CreateProperty from './pages/CreateProperty';
import MyBookings from './pages/MyBookings';
import FarmRecords from './pages/FarmRecords';
import PaymentCallback from './pages/PaymentCallback';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        {isAuthenticated && (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-property" element={<CreateProperty />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/farm-records" element={<FarmRecords />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

export default App;
