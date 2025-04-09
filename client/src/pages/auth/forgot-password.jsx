import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Veuillez entrer votre adresse email',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        'http://localhost:5000/api/auth/forgot-password',
        { email }
      );

      if (response.data.success) {
        toast({
          title: 'Email de réinitialisation envoyé',
          description: 'Veuillez vérifier votre boîte de réception',
        });
        navigate('/auth/login');
      }
    } catch (error) {
      toast({
        title: error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <Input
              type="email"
              required
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </div>

          <div className="text-sm text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => navigate('/auth/login')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Retour à la connexion
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword; 