import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const navigate = useNavigate();
  const { token } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    // Verify token when component mounts
    const verifyToken = async () => {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/verify-reset-token', { token });
        if (!response.data.success) {
          setIsValidToken(false);
          toast({
            title: 'Lien invalide ou expiré',
            description: 'Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setIsValidToken(false);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la vérification du lien.',
          variant: 'destructive',
        });
      }
    };

    verifyToken();
  }, [token, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Le mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        newPassword: password
      });

      if (response.data.success) {
        toast({
          title: 'Mot de passe réinitialisé',
          description: 'Votre mot de passe a été réinitialisé avec succès.',
        });
        navigate('/auth/login');
      }
    } catch (error) {
      toast({
        title: error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Lien invalide
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Le lien de réinitialisation est invalide ou a expiré.
            </p>
          </div>
          <div className="text-center">
            <Button
              onClick={() => navigate('/auth/forgot-password')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Demander un nouveau lien
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Réinitialiser votre mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez votre nouveau mot de passe
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                type="password"
                required
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <Input
                type="password"
                required
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword; 