import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LoginPage as SharedLoginPage, showError } from '@santonastaso/shared';

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setIsLoading(true);

    try {
      await signIn(data.email, data.password);
      navigate('/');
    } catch (error) {
      showError('Errore durante il login: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🔍 TRACC LoginPage: Using SharedLoginPage component', { SharedLoginPage });

  return (
    <SharedLoginPage
      title="TRACC"
      logo="/trace.svg"
      subtitle="Sistema Tracciabilità Molino"
      labels={{
        signIn: 'Accedi',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Password dimenticata?',
        signUp: 'Registrati qui',
        signUpText: 'Non hai un account?'
      }}
      demoCredentials={{ email: 'admin@tracc.com', password: 'admin123' }}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      signUpUrl="/signup"
      backgroundImage="/trace-bg.jpg" // Optional background
      backgroundColor="#18181b" // Match CRM_demo's bg-zinc-900
    />
  );
}

export default LoginPage;
