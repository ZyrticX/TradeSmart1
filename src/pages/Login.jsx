import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const language = localStorage.getItem('language') || 'en';

  // Redirect if already logged in or login was successful
  useEffect(() => {
    // Check if user is logged in
    if (user) {
      console.log('👤 User already logged in, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Check if login was successful but user state not updated yet
    const loginSuccess = localStorage.getItem('loginSuccess');
    if (loginSuccess === 'true') {
      console.log('🔄 Login success detected, clearing flag and redirecting...');
      localStorage.removeItem('loginSuccess');

      // Small delay to ensure auth state catches up
      setTimeout(() => {
        navigate('/dashboard');
      }, 50);
      return;
    }
  }, [user, navigate]);

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔑 Login attempt with email:', email);
      
      const { data, error } = await signIn(email, password);
      
      console.log('📥 Login response:', { data, error });
      
      if (error) {
        console.error('❌ Login error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
          hint: error.hint
        });
        
        // Show specific error message
        if (error.message?.includes('Invalid login credentials')) {
          setError(getText('Invalid email or password', 'אימייל או סיסמה שגויים'));
        } else if (error.message?.includes('Email not confirmed')) {
          setError(getText('Please confirm your email first', 'אנא אשר את האימייל תחילה'));
        } else {
          setError(error.message || getText('Login failed', 'ההתחברות נכשלה'));
        }
        return;
      }

      console.log('✅ Login successful! Data:', data);

      // Update local storage to indicate login success
      localStorage.setItem('loginSuccess', 'true');

      // Navigate immediately - the useEffect will handle the auth state update
      console.log('🧭 Navigating to dashboard...');
      navigate('/dashboard');
    } catch (err) {
      console.error('❌ Login exception:', err);
      setError(err.message || getText('An error occurred', 'אירעה שגיאה'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">TradeSmart</span>
        </Link>

        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {getText('Welcome Back', 'ברוך שובך')}
            </CardTitle>
            <CardDescription className="text-center">
              {getText('Enter your credentials to access your account', 'הזן את הפרטים שלך כדי לגשת לחשבון')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  {getText('Email', 'אימייל')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={getText('you@example.com', 'you@example.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {getText('Password', 'סיסמה')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/forgot-password" 
                  className="text-purple-600 hover:text-purple-700 hover:underline"
                >
                  {getText('Forgot password?', 'שכחת סיסמה?')}
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {getText('Signing in...', 'מתחבר...')}
                  </>
                ) : (
                  getText('Sign In', 'התחבר')
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600">
              {getText("Don't have an account?", 'אין לך חשבון?')}{' '}
              <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
                {getText('Sign up', 'הירשם')}
              </Link>
            </div>
            <div className="text-center">
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← {getText('Back to home', 'חזרה לדף הבית')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

