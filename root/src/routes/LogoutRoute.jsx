import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../components/ui';
import useAuth from '../hooks/useAuth';

export default function LogoutRoute() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    let isActive = true;

    logout().finally(() => {
      if (isActive) {
        navigate('/login', { replace: true });
      }
    });

    return () => {
      isActive = false;
    };
  }, [logout, navigate]);

  return <LoadingScreen label="Ending your session" />;
}
