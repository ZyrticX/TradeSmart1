import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  BarChart3, 
  BookOpen, 
  Shield, 
  Zap, 
  Award,
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
  Target,
  Users,
  TrendingDown,
  DollarSign,
  LineChart,
  Brain,
  Lock,
  Rocket,
  Globe
} from 'lucide-react';

export default function LandingPage() {
  const [language, setLanguage] = React.useState(() => localStorage.getItem('language') || 'he');
  
  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'he' ? 'en' : 'he';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const features = [
    {
      icon: BarChart3,
      title: getText('Advanced Analytics', 'ניתוח מתקדם'),
      description: getText('Track your performance with detailed charts and metrics', 'עקוב אחר הביצועים שלך עם גרפים ומדדים מפורטים')
    },
    {
      icon: TrendingUp,
      title: getText('Trade Management', 'ניהול עסקאות'),
      description: getText('Manage all your trades in one place with real-time updates', 'נהל את כל העסקאות שלך במקום אחד עם עדכונים בזמן אמת')
    },
    {
      icon: BookOpen,
      title: getText('Trading Journal', 'יומן מסחר'),
      description: getText('Document your thoughts, lessons, and progress', 'תעד את המחשבות, הלקחים והקידמה שלך')
    },
    {
      icon: Shield,
      title: getText('Secure & Private', 'מאובטח ופרטי'),
      description: getText('Your data is encrypted and secured with enterprise-grade security', 'הנתונים שלך מוצפנים ומאובטחים באבטחה ברמה ארגונית')
    },
    {
      icon: Zap,
      title: getText('Fast & Reliable', 'מהיר ואמין'),
      description: getText('Built on modern technology for lightning-fast performance', 'בנוי על טכנולוגיה מודרנית לביצועים מהירים במיוחד')
    },
    {
      icon: Award,
      title: getText('Multi-Language', 'רב-לשוני'),
      description: getText('Available in English and Hebrew', 'זמין באנגלית ועברית')
    }
  ];

  const pricingPlans = [
    {
      name: getText('Free', 'חינמי'),
      price: '$0',
      description: getText('Perfect for getting started', 'מושלם להתחלה'),
      features: [
        getText('Up to 50 trades/month', 'עד 50 עסקאות לחודש'),
        getText('Basic analytics', 'ניתוח בסיסי'),
        getText('Trading journal', 'יומן מסחר'),
        getText('Email support', 'תמיכה במייל')
      ]
    },
    {
      name: getText('Pro', 'מקצועי'),
      price: '$19',
      popular: true,
      description: getText('For serious traders', 'לסוחרים רציניים'),
      features: [
        getText('Unlimited trades', 'עסקאות בלתי מוגבלות'),
        getText('Advanced analytics', 'ניתוח מתקדם'),
        getText('Custom strategies', 'אסטרטגיות מותאמות'),
        getText('Priority support', 'תמיכה עדיפה'),
        getText('Export reports', 'ייצוא דוחות')
      ]
    },
    {
      name: getText('Enterprise', 'ארגוני'),
      price: getText('Custom', 'מותאם'),
      description: getText('For teams and institutions', 'לצוותים וארגונים'),
      features: [
        getText('Everything in Pro', 'כל מה שיש ב-Pro'),
        getText('Multi-user accounts', 'חשבונות מרובי משתמשים'),
        getText('API access', 'גישה ל-API'),
        getText('Custom integrations', 'אינטגרציות מותאמות'),
        getText('Dedicated support', 'תמיכה ייעודית')
      ]
    }
  ];

  const isRTL = language === 'he';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">TradeSmart</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={language === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={toggleLanguage}
                className="text-xs px-2 py-1 h-6"
              >
                ENG
              </Button>
              <Button
                variant={language === 'he' ? 'default' : 'ghost'}
                size="sm"
                onClick={toggleLanguage}
                className="text-xs px-2 py-1 h-6"
              >
                ע
              </Button>
            </div>
            <Link to="/login">
              <Button variant="ghost" className="hover:bg-purple-50">
                {getText('Login', 'התחבר')}
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all">
                <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {getText('Get Started', 'התחל עכשיו')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative">
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">{getText('Now with AI-Powered Insights!', 'עכשיו עם תובנות מבוססות AI!')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              {getText('Trade Smarter,', 'סחור בצורה חכמה,')}
            </span>
            <br />
            <span className="text-gray-900">
              {getText('Manage Your Trades Right', 'נהל את העסקאות שלך נכון')}
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {getText('The complete trading journal and analytics platform for modern traders. Track, analyze, and improve your trading performance.', 'פלטפורמת יומן וניתוח מסחר מקיפה לסוחרים מודרניים. עקוב, נתח ושפר את ביצועי המסחר שלך.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-10 py-6 shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105">
                <Rocket className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {getText('Start Free Trial', 'התחל ניסיון חינם')}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2 hover:border-purple-600 hover:bg-purple-50 transition-all">
              {getText('Watch Demo', 'צפה בהדגמה')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-1">10K+</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                {getText('Active Traders', 'סוחרים פעילים')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-1">$2M+</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <DollarSign className="w-4 h-4" />
                {getText('Tracked Volume', 'נפח מעוקב')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-1">4.9</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-purple-600" />
                {getText('User Rating', 'דירוג משתמשים')}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Icons */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="absolute top-40 right-20 animate-float animation-delay-2000">
          <div className="w-20 h-20 bg-pink-100 rounded-2xl flex items-center justify-center shadow-lg">
            <LineChart className="w-10 h-10 text-pink-600" />
          </div>
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float animation-delay-4000">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shadow-lg">
            <Target className="w-7 h-7 text-blue-600" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-white to-purple-50 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            <span className="text-xs font-semibold">{getText('FEATURES', 'תכונות')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {getText('Everything You Need', 'כל מה שאתה צריך')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {getText('Powerful features to help you become a better trader', 'תכונות עוצמתיות שיעזרו לך להיות סוחר טוב יותר')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group bg-white/80 backdrop-blur-sm"
            >
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <feature.icon className="w-7 h-7 text-purple-600" />
                </div>
                <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {getText('Simple, Transparent Pricing', 'תמחור פשוט ושקוף')}
          </h2>
          <p className="text-xl text-gray-600">
            {getText('Choose the plan that fits your needs', 'בחר את התוכנית שמתאימה לך')}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-purple-500 border-2 shadow-xl' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {getText('Most Popular', 'הכי פופולרי')}
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {plan.price}
                  {plan.price !== getText('Custom', 'מותאם') && (
                    <span className="text-lg text-gray-500">/{getText('month', 'חודש')}</span>
                  )}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {getText('Get Started', 'התחל')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="py-16 text-center">
            <h2 className="text-4xl font-bold mb-4">
              {getText('Ready to Start Trading Smarter?', 'מוכן להתחיל לסחור בצורה חכמה יותר?')}
            </h2>
            <p className="text-xl mb-8 text-purple-50">
              {getText('Join thousands of traders already improving their performance', 'הצטרף לאלפי סוחרים שכבר משפרים את הביצועים שלהם')}
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8">
                {getText('Start Your Free Trial', 'התחל ניסיון חינם')}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TradeSmart</span>
              </div>
              <p className="text-sm">
                {getText('The professional trading journal for modern traders.', 'יומן המסחר המקצועי לסוחרים מודרניים.')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">{getText('Product', 'מוצר')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">{getText('Company', 'חברה')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">{getText('Legal', 'משפטי')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2025 TradeSmart. {getText('All rights reserved.', 'כל הזכויות שמורות.')}
          </div>
        </div>
      </footer>
    </div>
  );
}

