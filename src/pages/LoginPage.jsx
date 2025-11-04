import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LoginPage as SharedLoginPage, showError } from '@santonastaso/shared';

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      await signIn(data.email, data.password);
      navigate('/');
    } catch (err) {
      setError('Errore durante il login: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
      error={error}
      onSubmit={handleSubmit}
      forgotPasswordUrl="/forgot-password"
      signUpUrl="/signup"
      showForgotPassword={true}
      showSignUp={true}
    />
  );
}

export default LoginPage;
