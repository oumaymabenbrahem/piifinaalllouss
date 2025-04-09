import CommonForm from "@/components/common/form";
import { useToast } from "@/components/ui/use-toast";
import { loginFormControls } from "@/config";
import { loginUser } from "@/store/auth-slice";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { auth, provider, signInWithPopup, fbProvider } from "@/firebase";
import axios from 'axios';

const initialState = {
  email: "",
  password: "",
};

function AuthLogin() {
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      dispatch(loginUser({
        email: user.email,
        password: 'google_auth_'
      })).then((data) => {
        if (data?.payload?.success) {
          toast({
            title: data?.payload?.message,
          });
        } else {
          toast({
            title: data?.payload?.message,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Google login failed:", error);
      toast({
        title: "Failed to login with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(auth, fbProvider);
      const user = result.user;
      
      dispatch(loginUser({
        email: user.email,
        password: 'facebook_auth_'
      })).then((data) => {
        if (data?.payload?.success) {
          toast({
            title: data?.payload?.message,
          });
        } else {
          toast({
            title: data?.payload?.message,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Facebook login failed:", error);
      toast({
        title: "Failed to login with Facebook. Please try again.",
        variant: "destructive",
      });
    }
  };

  function onSubmit(event) {
    event.preventDefault();

    dispatch(loginUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast({
          title: data?.payload?.message,
        });
      } else {
        toast({
          title: data?.payload?.message,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="mt-2">
          Don't have an account
          <Link
            className="font-medium ml-2 text-primary hover:underline"
            to="/auth/register"
          >
            Register
          </Link>
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <FcGoogle size={20} />
          <span>Continue with Google</span>
        </button>

        <button
          onClick={handleFacebookLogin}
          className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white rounded-lg px-4 py-3 font-medium hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2"
        >
          <FaFacebook size={20} />
          <span>Continue with Facebook</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">Or continue with email</span>
          </div>
        </div>
      </div>

      <CommonForm
        formControls={loginFormControls}
        buttonText={"Sign In"}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
      />

      <div className="text-sm text-center">
        <Link
          to="/forgot-password"
          className="font-medium text-emerald-600 hover:text-emerald-500"
        >
          Mot de passe oublié ?
        </Link>
      </div>
    </div>
  );
}

export default AuthLogin;
