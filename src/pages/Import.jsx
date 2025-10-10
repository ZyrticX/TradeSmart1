import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Trade, Account } from "@/api/entities";

export default function Import() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  
  const language = localStorage.getItem('language') || 'en';
  const isRTL = language === 'he';

  const getText = (en, he) => {
    switch(language) {
      case 'he': return he;
      default: return en;
    }
  };

  React.useEffect(() => {
    const loadCurrentAccount = async () => {
      const currentAccountId = localStorage.getItem('currentAccountId');
      if (currentAccountId) {
        try {
          const account = await Account.get(currentAccountId);
          if (account) {
            setCurrentAccount(account);
          } else {
            console.warn('⚠️ Account not found:', currentAccountId);
            localStorage.removeItem('currentAccountId');
            setCurrentAccount(null);
          }
        } catch (error) {
          console.error('Error loading current account:', error);
          setCurrentAccount(null);
        }
      }
    };
    loadCurrentAccount();
  }, []);

  const downloadSampleCSV = () => {
    const sampleData = [
      [
        getText('Symbol', 'סימבול'),
        getText('Date', 'תאריך'),
        getText('Direction', 'כיוון'),
        getText('Entry Price', 'מחיר כניסה'),
        getText('Quantity', 'כמות'),
        getText('Stop Price', 'מחיר סטופ'),
        getText('Target Price', 'מחיר יעד'),
        getText('Strategy', 'אסטרטגיה'),
        getText('Notes', 'הערות')
      ],
      [
        'AAPL',
        '2024-01-15 10:30:00',
        'long',
        '150.50',
        '100',
        '145.00',
        '160.00',
        'Breakout',
        getText('Sample trade entry', 'דוגמא לרישום עסקה')
      ]
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${getText('sample_trades', 'דוגמא_עסקאות')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setUploadResult(null);
    } else {
      alert(getText('Please select a CSV file', 'אנא בחר קובץ CSV'));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!currentAccount) {
      alert(getText('Please select an account first', 'אנא בחר חשבון תחילה'));
      return;
    }

    setIsUploading(true);
    try {
      // Upload file
      const { file_url } = await UploadFile({ file });
      
      // Extract data from CSV
      const jsonSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            symbol: { type: "string" },
            date: { type: "string" },
            direction: { type: "string" },
            entry_price: { type: "number" },
            quantity: { type: "number" },
            stop_price: { type: "number" },
            target_price: { type: "number" },
            strategy: { type: "string" },
            notes: { type: "string" }
          },
          required: ["symbol", "date", "direction", "entry_price", "quantity"]
        }
      };

      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: jsonSchema
      });

      if (extractResult.status === 'success' && extractResult.output) {
        // Process and import trades
        const trades = extractResult.output;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const tradeData of trades) {
          try {
            const formattedTrade = {
              account_id: currentAccount.id,
              symbol: tradeData.symbol?.toUpperCase() || '',
              date_time: tradeData.date || new Date().toISOString(),
              direction: tradeData.direction?.toLowerCase() === 'short' ? 'short' : 'long',
              entry_price: Number(tradeData.entry_price) || 0,
              quantity: Number(tradeData.quantity) || 0,
              total_quantity: Number(tradeData.quantity) || 0,
              stop_price: Number(tradeData.stop_price) || 0,
              target_price: tradeData.target_price ? Number(tradeData.target_price) : null,
              strategy: tradeData.strategy || '',
              status: 'open',
              risk_percentage: currentAccount.default_risk_percentage || 2,
              risk_amount: 0,
              position_size: (Number(tradeData.entry_price) || 0) * (Number(tradeData.quantity) || 0),
              total_investment: (Number(tradeData.entry_price) || 0) * (Number(tradeData.quantity) || 0),
              profit_loss: 0,
              total_commission: currentAccount.commission_fee || 0
            };

            // Calculate risk amount
            const entryPrice = formattedTrade.entry_price;
            const stopPrice = formattedTrade.stop_price;
            const quantity = formattedTrade.quantity;
            
            if (entryPrice > 0 && stopPrice > 0 && quantity > 0) {
              formattedTrade.risk_amount = Math.abs(entryPrice - stopPrice) * quantity;
            }

            await Trade.create(formattedTrade);
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push(`${tradeData.symbol}: ${error.message}`);
          }
        }

        setUploadResult({
          success: true,
          successCount,
          errorCount,
          errors: errors.slice(0, 5) // Show first 5 errors
        });
      } else {
        setUploadResult({
          success: false,
          message: extractResult.details || getText('Failed to process CSV file', 'נכשל בעיבוד קובץ CSV')
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setUploadResult({
        success: false,
        message: getText('Upload failed. Please try again.', 'העלאה נכשלה. אנא נסה שוב.')
      });
    }
    setIsUploading(false);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getText('Import Data', 'ייבוא נתונים')}</h1>
        <p className="text-gray-600 mt-1">{getText('Upload CSV file to import your trades', 'העלה קובץ CSV לייבוא העסקאות שלך')}</p>
      </div>

      {!currentAccount && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              <span>{getText('Please select an account from Settings before importing data.', 'אנא בחר חשבון מההגדרות לפני ייבוא נתונים.')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            {getText('Step 1: Download Sample CSV', 'שלב 1: הורד קובץ CSV לדוגמה')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {getText('Download a sample CSV file with the correct format and fill in your trading data.', 'הורד קובץ CSV לדוגמה עם הפורמט הנכון ומלא את נתוני המסחר שלך.')}
          </p>
          <Button onClick={downloadSampleCSV} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            {getText('Download Sample CSV', 'הורד CSV לדוגמה')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {getText('Step 2: Upload Your CSV File', 'שלב 2: העלה את קובץ ה-CSV שלך')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csvFile">{getText('Select CSV File', 'בחר קובץ CSV')}</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading || !currentAccount}
            />
          </div>
          
          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
            </div>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading || !currentAccount}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {getText('Uploading...', 'מעלה...')}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {getText('Import Trades', 'ייבא עסקאות')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card className={uploadResult.success ? 'border-purple-200 bg-purple-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className={`flex items-start gap-2 ${uploadResult.success ? 'text-purple-800' : 'text-red-800'}`}>
              {uploadResult.success ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
              <div>
                {uploadResult.success ? (
                  <>
                    <h3 className="font-semibold">{getText('Import Completed', 'ייבוא הושלם')}</h3>
                    <p>{getText('Successfully imported', 'ייובאו בהצלחה')} {uploadResult.successCount} {getText('trades', 'עסקאות')}</p>
                    {uploadResult.errorCount > 0 && (
                      <div className="mt-2">
                        <p className="text-orange-700">{uploadResult.errorCount} {getText('trades failed to import:', 'עסקאות נכשלו בייבוא:')}</p>
                        <ul className="list-disc list-inside mt-1 text-sm">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">{getText('Import Failed', 'ייבוא נכשל')}</h3>
                    <p>{uploadResult.message}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}