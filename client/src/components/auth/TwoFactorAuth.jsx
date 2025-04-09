import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/config/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSelector } from 'react-redux';

function TwoFactorAuth({ isOpen, onClose }) {
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post('/api/auth/2fa/generate');
      
      if (response.data.success) {
        setQrCode(response.data.qrCode);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la génération du QR code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token) {
      toast({
        title: 'Code requis',
        description: 'Veuillez entrer le code de vérification',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post('/api/auth/2fa/verify', { token });
      
      if (response.data.success) {
        toast({
          title: 'Succès',
          description: '2FA activé avec succès',
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Code invalide',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuration 2FA</DialogTitle>
          <DialogDescription>
            Scannez le QR code avec Google Authenticator et entrez le code de vérification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!qrCode ? (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Génération en cours...' : 'Générer QR Code'}
            </Button>
          ) : (
            <>
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Code de vérification"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <Button
                  onClick={handleVerify}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Vérification en cours...' : 'Vérifier et Activer'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TwoFactorAuth; 