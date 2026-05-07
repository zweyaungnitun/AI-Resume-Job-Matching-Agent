import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Briefcase, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SegmentedTabs } from '../components/ui/segmented-tabs';
import { ErrorAlert } from '../components/ui/error-alert';

type Tab = 'signin' | 'signup';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithPassword, signup, isAuthenticated } = useAuth();

  const [tab, setTab] = useState<Tab>('signin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sign-in form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign-up form
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');

  const redirectTarget = (location.state as any)?.from?.pathname || '/cv-input';

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTarget, { replace: true });
  }, [isAuthenticated, navigate, redirectTarget]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse);
      navigate(redirectTarget, { replace: true });
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!signInEmail || !signInPassword) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(signInEmail, signInPassword);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Sign-in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!signUpEmail || !signUpPassword) {
      setError('Email and password are required.');
      return;
    }
    if (signUpPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await signup(signUpEmail, signUpPassword, signUpName || undefined);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'signin', label: 'Sign In' },
    { id: 'signup', label: 'Create Account' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/15 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <Briefcase className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              JobMatch
            </h1>
            <p className="text-muted-foreground mt-1">AI-powered resume analysis and job matching</p>
          </div>
        </div>

        <Card className="shadow-2xl border-white/80 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <SegmentedTabs
              tabs={tabs}
              activeTab={tab}
              onTabChange={(id) => { setTab(id as Tab); setError(null); }}
            />
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {error && <ErrorAlert message={error} />}

            {/* Google OAuth — available on both tabs */}
            <div className="space-y-3">
              <CardDescription className="text-center text-xs uppercase tracking-wide">
                {tab === 'signin' ? 'Sign in with' : 'Sign up with'}
              </CardDescription>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  theme="outline"
                  size="large"
                  text={tab === 'signin' ? 'signin_with' : 'signup_with'}
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* ── Sign In Form ───────────────────────────────────── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-9"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="pl-9 pr-10"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* ── Sign Up Form ───────────────────────────────────── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full name (optional)"
                    className="pl-9"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-9"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min. 8 characters)"
                    className="pl-9 pr-10"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm password"
                    className="pl-9 pr-10"
                    value={signUpConfirm}
                    onChange={(e) => setSignUpConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
