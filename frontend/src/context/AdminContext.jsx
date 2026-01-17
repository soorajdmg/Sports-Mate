import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    const adminToken = localStorage.getItem('adminToken');

    if (storedAdmin && adminToken) {
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const loginAdmin = (token, adminData) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
