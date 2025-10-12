import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Loader2, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const language = localStorage.getItem('language') || 'en';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('👤 User already logged in, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(getText('Please fill in all fields', 'אנא מלא את כל השדות'));
      return false;
    }

    if (formData.password.length < 6) {
      setError(getText('Password must be at least 6 characters', 'הסיסמה חייבת להיות לפחות 6 תווים'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(getText('Passwords do not match', 'הסיסמאות אינן תואמות'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(getText('Please enter a valid email address', 'אנא הזן כתובת אימייל תקינה'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName
      });

      if (error) {
        if (error.message?.includes('already registered')) {
          setError(getText('This email is already registered. Please sign in instead.', 'האימייל כבר רשום. אנא התחבר במקום.'));
        } else {
          setError(getText('An error occurred during registration. Please try again.', 'אירעה שגיאה במהלך ההרשמה. אנא נסה שוב.'));
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(getText('An unexpected error occurred. Please try again.', 'אירעה שגיאה לא צפויה. אנא נסה שוב.'));
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
              {getText('Create Account', 'יצירת חשבון')}
            </CardTitle>
            <CardDescription className="text-center">
              {getText('Start your trading journey today', 'התחל את מסע המסחר שלך היום')}
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

              {success && (
                <Alert className="bg-purple-50 border-purple-200">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    {getText('Account created successfully! Redirecting...', 'החשבון נוצר בהצלחה! מפנה...')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">
                  {getText('Full Name', 'שם מלא')}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={getText('John Doe', 'ישראל ישראלי')}
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
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
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {getText('At least 6 characters', 'לפחות 6 תווים')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {getText('Confirm Password', 'אימות סיסמה')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {getText('Creating account...', 'יוצר חשבון...')}
                  </>
                ) : (
                  getText('Create Account', 'צור חשבון')
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                {getText('By signing up, you agree to our Terms of Service and Privacy Policy', 'בהרשמה, אתה מסכים לתנאי השירות ולמדיניות הפרטיות')}
              </p>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-600">
              {getText('Already have an account?', 'כבר יש לך חשבון?')}{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
                {getText('Sign in', 'התחבר')}
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

