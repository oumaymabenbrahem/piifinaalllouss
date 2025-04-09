import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, Upload } from 'lucide-react';
import axios from 'axios';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import Cookies from 'js-cookie';

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVerifImage, setPreviewVerifImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    profileImage: null,
    imageVerif: null,
    address: '',
    phone: '',
  });
  const fileInputRef = useRef(null);
  const verifFileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const response = await axios.post("http://localhost:5000/api/auth/google", {
        email: user.email,
        username: user.displayName,
        image: user.photoURL,
      });

      if (response.data.success) {
        Cookies.set("token", response.data.token, { expires: 7 });
        navigate("/profile");
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setErrorMessage("Failed to login with Google. Please try again.");
    }
  };

  // ... rest of your existing code ...

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 p-8 flex flex-col">
        {/* ... existing JSX ... */}

        <div className="max-w-md mx-auto w-full">
          <h1 className="text-4xl font-bold mb-4">Create Your Account</h1>
          <p className="text-gray-600 mb-8">Fill in your details to get started</p>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 mb-4"
          >
            <FcGoogle size={20} />
            <span>Sign up with Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* ... rest of your existing JSX ... */}
        </div>
      </div>

      {/* ... rest of your existing JSX ... */}
    </div>
  );
}

export default SignUp; 