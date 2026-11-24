import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const LoginPage: React.FC = () => {
  const { signIn, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    await signIn('demo@personalhub.local', 'demo');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-hub-bg dark:bg-hub-bg-dark">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-hub-primary to-hub-secondary text-white flex items-center justify-center shadow-lg shadow-hub-primary/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-hub-text dark:text-hub-text-dark">
            Sign In to PersonalHub
          </h2>
          <p className="text-xs text-hub-muted dark:text-hub-muted-dark">
            One place for everything you save, earn, spend, plan and learn.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-hub-border dark:border-hub-border-dark w-full" />
          <span className="bg-white dark:bg-hub-card-dark px-3 text-[11px] uppercase font-bold text-hub-muted absolute">
            Or Quick Access
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full font-semibold"
          onClick={handleDemoSignIn}
        >
          <span>Continue with Demo Profile (Instant)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Card>
    </div>
  );
};
