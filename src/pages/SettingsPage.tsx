import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Users, Printer, Globe, Database, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '../store/ui.store';
import i18n from '../i18n';

export function SettingsPage() {
  const { t } = useTranslation();
  const { addToast, language, setLanguage } = useUIStore();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');

  useEffect(() => {
    loadSettings();
    loadCashiers();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await window.electronAPI.getSettings();
      setSettings(data);
      setBusinessName(data.business_name || '');
      setBusinessPhone(data.business_phone || '');
      setBusinessAddress(data.business_address || '');
      setReceiptFooter(data.receipt_footer || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadCashiers = async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.getCashiers();
      setCashiers(data);
    } catch (error) {
      console.error('Failed to load cashiers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBusinessSettings = async () => {
    try {
      await window.electronAPI.setSetting('business_name', businessName);
      await window.electronAPI.setSetting('business_phone', businessPhone);
      await window.electronAPI.setSetting('business_address', businessAddress);
      await window.electronAPI.setSetting('receipt_footer', receiptFooter);
      addToast('Paramètres enregistrés', 'success');
    } catch (error) {
      addToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleLanguageChange = (lang: 'fr' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    window.electronAPI.setSetting('language', lang);
    addToast(`Langue changée en ${lang === 'fr' ? 'Français' : 'English'}`, 'success');
  };

  const handleBackup = async () => {
    try {
      const result = await window.electronAPI.backupDatabase();
      if (result.success) {
        addToast(`${t('settings.backup.success')}: ${result.path}`, 'success');
      } else {
        addToast('Erreur de sauvegarde', 'error');
      }
    } catch (error) {
      addToast('Erreur de sauvegarde', 'error');
    }
  };

  const handleTestPrint = async () => {
    try {
      await window.electronAPI.testPrint();
      addToast('Test d\'impression envoyé', 'success');
    } catch (error) {
      addToast('Erreur d\'impression', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-maive-noir">
          {t('settings.title')}
        </h1>
      </div>

      <Tabs defaultValue="business" className="flex-1">
        <TabsList className="bg-maive-cream mb-6">
          <TabsTrigger value="business" className="font-body">
            <Store className="w-4 h-4 mr-2" />
            {t('settings.business.title')}
          </TabsTrigger>
          <TabsTrigger value="cashiers" className="font-body">
            <Users className="w-4 h-4 mr-2" />
            {t('settings.cashiers.title')}
          </TabsTrigger>
          <TabsTrigger value="printer" className="font-body">
            <Printer className="w-4 h-4 mr-2" />
            {t('settings.printer.title')}
          </TabsTrigger>
          <TabsTrigger value="language" className="font-body">
            <Globe className="w-4 h-4 mr-2" />
            {t('settings.language.title')}
          </TabsTrigger>
          <TabsTrigger value="backup" className="font-body">
            <Database className="w-4 h-4 mr-2" />
            {t('settings.backup.title')}
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4">
          <Card className="bg-maive-warm-white border-maive-parchment">
            <CardHeader>
              <CardTitle className="font-display text-lg text-maive-noir">
                {t('settings.business.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-body text-sm text-maive-muted">
                  {t('settings.business.name')}
                </label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-body text-sm text-maive-muted">
                  {t('settings.business.phone')}
                </label>
                <Input
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-body text-sm text-maive-muted">
                  {t('settings.business.address')}
                </label>
                <Input
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-body text-sm text-maive-muted">
                  {t('settings.business.receiptFooter')}
                </label>
                <textarea
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full mt-1 p-3 rounded-maive-sm border border-maive-parchment bg-maive-warm-white font-body text-sm focus:border-maive-camel focus:ring-1 focus:ring-maive-camel/20 outline-none"
                  rows={3}
                />
              </div>
              <Button
                onClick={saveBusinessSettings}
                className="bg-maive-camel hover:bg-maive-camel-dark text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cashiers */}
        <TabsContent value="cashiers">
          <Card className="bg-maive-warm-white border-maive-parchment">
            <CardHeader>
              <CardTitle className="font-display text-lg text-maive-noir">
                {t('settings.cashiers.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-maive-muted">{t('common.loading')}</div>
              ) : (
                <div className="space-y-3">
                  {cashiers.map((cashier) => (
                    <div
                      key={cashier.id}
                      className="flex items-center justify-between p-3 bg-maive-cream rounded-maive-sm"
                    >
                      <div>
                        <span className="font-body font-medium">{cashier.name}</span>
                        <span className="ml-3 px-2 py-0.5 bg-maive-camel text-white text-xs rounded-maive-xs capitalize">
                          {t(`settings.cashiers.roles.${cashier.role}`)}
                        </span>
                      </div>
                      <span className={`text-xs ${cashier.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {cashier.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printer */}
        <TabsContent value="printer">
          <Card className="bg-maive-warm-white border-maive-parchment">
            <CardHeader>
              <CardTitle className="font-display text-lg text-maive-noir">
                {t('settings.printer.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-body text-sm text-maive-muted">
                Imprimante thermique 80mm configurée automatiquement.
              </p>
              <Button
                onClick={handleTestPrint}
                variant="outline"
                className="border-maive-camel text-maive-camel hover:bg-maive-camel hover:text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                {t('settings.printer.test')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language */}
        <TabsContent value="language">
          <Card className="bg-maive-warm-white border-maive-parchment">
            <CardHeader>
              <CardTitle className="font-display text-lg text-maive-noir">
                {t('settings.language.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <button
                  onClick={() => handleLanguageChange('fr')}
                  className={`flex-1 p-4 rounded-maive-md border-2 transition-all ${
                    language === 'fr'
                      ? 'border-maive-camel bg-maive-cream'
                      : 'border-maive-parchment hover:border-maive-camel-light'
                  }`}
                >
                  <span className="font-body text-lg">Français</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`flex-1 p-4 rounded-maive-md border-2 transition-all ${
                    language === 'en'
                      ? 'border-maive-camel bg-maive-cream'
                      : 'border-maive-parchment hover:border-maive-camel-light'
                  }`}
                >
                  <span className="font-body text-lg">English</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup */}
        <TabsContent value="backup">
          <Card className="bg-maive-warm-white border-maive-parchment">
            <CardHeader>
              <CardTitle className="font-display text-lg text-maive-noir">
                {t('settings.backup.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-body text-sm text-maive-muted">
                Exportez votre base de données SQLite pour créer une sauvegarde.
                Le fichier sera enregistré dans votre dossier Téléchargements.
              </p>
              <Button
                onClick={handleBackup}
                className="bg-maive-camel hover:bg-maive-camel-dark text-white"
              >
                <Database className="w-4 h-4 mr-2" />
                {t('settings.backup.export')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
