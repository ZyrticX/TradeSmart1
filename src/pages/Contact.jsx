import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { SendEmail } from "@/api/integrations";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await SendEmail({
        to: 'support@tradingsystem.com', // Replace with your actual support email
        subject: `${getText('Contact Form:', 'טופס יצירת קשר:')} ${formData.subject}`,
        body: `
${getText('Name:', 'שם:')} ${formData.name}
${getText('Email:', 'אימייל:')} ${formData.email}
${getText('Subject:', 'נושא:')} ${formData.subject}

${getText('Message:', 'הודעה:')}
${formData.message}
        `
      });
      
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      alert(getText('Failed to send message. Please try again.', 'נכשל בשליחת ההודעה. אנא נסה שוב.'));
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getText('Contact Us', 'צור קשר')}</h1>
        <p className="text-gray-600 mt-1">{getText('Get in touch with our support team', 'צור קשר עם צוות התמיכה שלנו')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Mail className="w-5 h-5" />
                {getText('Send us a message', 'שלח לנו הודעה')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <CheckCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">{getText('Message Sent!', 'הודעה נשלחה!')}</h3>
                  <p className="text-gray-600">{getText('We\'ll get back to you as soon as possible.', 'נחזור אליך בהקדם האפשרי.', 'Te responderemos lo antes posible.')}</p>
                  <Button onClick={() => setSubmitted(false)} className="mt-4" variant="outline">
                    {getText('Send Another Message', 'שלח הודעה נוספת')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <Label htmlFor="name">{getText('Full Name', 'שם מלא')}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <Label htmlFor="email">{getText('Email Address', 'כתובת אימייל')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <Label htmlFor="subject">{getText('Subject', 'נושא')}</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <Label htmlFor="message">{getText('Message', 'הודעה')}</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={6}
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Mail className="w-4 h-4 mr-2 animate-pulse" />
                        {getText('Sending...', 'שולח...')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {getText('Send Message', 'שלח הודעה')}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Mail className="w-4 h-4" />
                {getText('Email Support', 'תמיכה באימייל')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">support@tradingsystem.com</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone className="w-4 h-4" />
                {getText('Phone Support', 'תמיכה טלפונית')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
              <p className="text-xs text-gray-500 mt-1">
                {getText('Mon-Fri 9AM-6PM EST', 'ב-ו 9:00-18:00')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4" />
                {getText('Office Location', 'מיקום המשרד')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                123 Trading Street<br />
                Financial District<br />
                New York, NY 10001
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}