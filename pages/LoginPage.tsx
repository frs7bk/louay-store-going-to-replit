

import React, { useState, useContext, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/Button';
import { useI18n } from '../hooks/useI18n';

export const LoginPage: React.FC = () => {
  const authCtx = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!authCtx) {
    return <p>Authentication system is currently unavailable. Please contact support.</p>;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await authCtx.loginAdmin(password);

    if (success) {
        navigate('/admin', { replace: true });
    } else {
        // Error toast is handled in the context, but we set a local error for UI feedback
        setError(t('incorrectPassword'));
        setPassword('');
    }
    setIsLoading(false);
  };

  if (authCtx.isAdminAuthenticated) {
    // If already authenticated, redirect to admin panel
    navigate('/admin', { replace: true });
    return null; // or a loading spinner while redirecting
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] bg-gradient-to-br from-gumball-blue via-gumball-purple to-gumball-pink p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-gumball-dark-card shadow-2xl rounded-xl p-8 transform transition-all hover:scale-105">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display text-gumball-yellow">
            {t('appName')}
          </h1>
          <p className="text-lg font-techno text-gumball-dark dark:text-gumball-light-bg mt-2">
            {t('adminAccessPortal')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="adminPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('adminPassword')}
            </label>
            <input
              type="password"
              id="adminPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-3 bg-white text-gumball-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-gumball-pink focus:border-gumball-pink dark:bg-gumball-dark-card dark:text-gumball-light-bg dark:placeholder-gray-400"
              required
              placeholder={t('enterPassword')}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-3 rounded-md animate-wiggleSoft">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-display text-xl"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? t('verifying') : t('login')}
          </Button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 text-center">
          {t('authorizedPersonnel')}
        </p>
      </div>
    </div>
  );
};