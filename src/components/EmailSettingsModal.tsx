import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Clock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { EmailSettings } from '@/types/priorities';

interface EmailSettingsModalProps {
  settings: EmailSettings;
  onSave: (settings: EmailSettings) => void;
}

const PROVIDERS = [
  { label: 'Gmail', host: 'smtp.gmail.com', port: 587, hint: 'Use an App Password (not your regular password). Enable at myaccount.google.com/apppasswords' },
  { label: 'Outlook / Hotmail', host: 'smtp-mail.outlook.com', port: 587, hint: 'Use your regular Outlook password.' },
  { label: 'Yahoo Mail', host: 'smtp.mail.yahoo.com', port: 587, hint: 'Use an App Password from Yahoo account security settings.' },
  { label: 'Custom / Other', host: '', port: 587, hint: 'Enter your SMTP server details manually.' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const label = i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`;
  return { label, value: `${String(i).padStart(2, '0')}:00` };
});

const EmailSettingsModal: React.FC<EmailSettingsModalProps> = ({ settings, onSave }) => {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendTime, setSendTime] = useState('18:00');
  const [provider, setProvider] = useState('Gmail');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRecipientEmail(settings.recipientEmail ?? '');
    setSendTime(settings.sendTime ?? '18:00');
    setSmtpUser(settings.smtp?.user ?? '');
    setSmtpPass(settings.smtp?.pass ?? '');
    const h = settings.smtp?.host ?? 'smtp.gmail.com';
    const p = settings.smtp?.port ?? 587;
    setSmtpHost(h);
    setSmtpPort(p);
    const matched = PROVIDERS.find(pr => pr.host === h && pr.host !== '');
    setProvider(matched ? matched.label : 'Custom / Other');
    setSaved(false);
  }, [open, settings]);

  const handleProviderChange = (label: string) => {
    setProvider(label);
    const pr = PROVIDERS.find(p => p.label === label);
    if (pr && pr.host) { setSmtpHost(pr.host); setSmtpPort(pr.port); }
  };

  const currentHint = PROVIDERS.find(p => p.label === provider)?.hint ?? '';

  const isValid =
    recipientEmail.trim().includes('@') &&
    smtpHost.trim().length > 0 &&
    smtpUser.trim().includes('@') &&
    smtpPass.trim().length > 0;

  const handleSave = () => {
    onSave({
      recipientEmail: recipientEmail.trim(),
      sendTime,
      smtp: { host: smtpHost.trim(), port: smtpPort, user: smtpUser.trim(), pass: smtpPass },
    });
    setSaved(true);
    setTimeout(() => setOpen(false), 800);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-400 dark:border-border" title="Email settings">
          <Mail className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Daily Email Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">

          {/* Recipient + time */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="recipient-email">Send summary to</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={e => { setRecipientEmail(e.target.value); setSaved(false); }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="send-time" className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Send time (daily)
              </Label>
              <select
                id="send-time"
                value={sendTime}
                onChange={e => { setSendTime(e.target.value); setSaved(false); }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {HOUR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* SMTP */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Outgoing mail (SMTP)</p>

            <div className="space-y-1.5">
              <Label>Email provider</Label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map(pr => (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => handleProviderChange(pr.label)}
                    className={`px-3 py-2 rounded-md border text-sm text-left transition-colors ${
                      provider === pr.label
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-input bg-background hover:bg-muted/50'
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
              {currentHint && (
                <p className="text-xs text-muted-foreground">{currentHint}</p>
              )}
            </div>

            {provider === 'Custom / Other' && (
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="smtp-host">SMTP host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.example.com"
                    value={smtpHost}
                    onChange={e => { setSmtpHost(e.target.value); setSaved(false); }}
                  />
                </div>
                <div className="w-24 space-y-1.5">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={smtpPort}
                    onChange={e => { setSmtpPort(Number(e.target.value)); setSaved(false); }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="smtp-user">Your email (sender)</Label>
              <Input
                id="smtp-user"
                type="email"
                placeholder="you@gmail.com"
                value={smtpUser}
                onChange={e => { setSmtpUser(e.target.value); setSaved(false); }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="smtp-pass">
                {provider === 'Gmail' ? 'App password' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="smtp-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder={provider === 'Gmail' ? '16-character app password' : 'Password'}
                  value={smtpPass}
                  onChange={e => { setSmtpPass(e.target.value); setSaved(false); }}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stored in your local data file. Never leaves your machine.
              </p>
            </div>
          </div>

          <div className="rounded-md bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">After saving, activate scheduled emails:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open PowerShell in the <code className="bg-muted px-1 rounded">priorityviz-local</code> folder</li>
              <li>Run <code className="bg-muted px-1 rounded">powershell -File scripts\setup-task.ps1</code></li>
              <li>Test with <code className="bg-muted px-1 rounded">node scripts\send-daily-summary.js</code></li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {saved
              ? <><CheckCircle className="w-4 h-4 mr-1.5" />Saved</>
              : 'Save settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailSettingsModal;
