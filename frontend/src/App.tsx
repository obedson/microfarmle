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
import EditProperty from './pages/EditProperty';
import MyBookings from './pages/MyBookings';
import FarmRecords from './pages/FarmRecords';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import AddCourse from './pages/AddCourse';
import EditCourse from './pages/EditCourse';
import Marketplace from './pages/Marketplace';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import ProductDetail from './pages/ProductDetail';
import PaymentCallback from './pages/PaymentCallback';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/products/:id" element={<ProductDetail />} />
        <Route path="/add-course" element={<AddCourse />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        {isAuthenticated && (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-property" element={<CreateProperty />} />
            <Route path="/properties/:id/edit" element={<EditProperty />} />
            <Route path="/courses/:id/edit" element={<EditCourse />} />
            <Route path="/marketplace/add-product" element={<AddProduct />} />
            <Route path="/marketplace/products/:id/edit" element={<EditProduct />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/farm-records" element={<FarmRecords />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

export default App;
