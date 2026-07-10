'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '@/app/utils/axios';

export default function UserVerify() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prevent double execution in Strict Mode
  const hasVerified = useRef(false);

  // Verify Token on Page Load
  useEffect(() => {
    // Prevent double execution
    if (hasVerified.current) return;

    const verifyEmail = async () => {
      if (!token) {
        setIsVerifying(false);
        setIsValidToken(false);
        setErrorMessage('No verification token provided');
        return;
      }

      // Mark as verified to prevent double execution
      hasVerified.current = true;


      try {
        setIsVerifying(true);

        const url = `/api/v1/auth/email/verify?token=${token}`;


        const response = await api.get(url, {
          headers: { Accept: "application/json", 'ngrok-skip-browser-warning': 'true' }
        });

        const data = response.data;

        // Flexible success condition
        if (data.success || response.status === 200) {
          setIsValidToken(true);
          setErrorMessage("");
        } else {
          setIsValidToken(false);
          setErrorMessage(
            data?.message ||
            data?.error ||
            data?.detail ||
            "Verification failed."
          );
        }

      } catch (error: any) {
        console.error("Email verification error:", error);
 
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||  error?.message ||
          "Network error. Please check your connection.";

        setIsValidToken(false);
        setErrorMessage(msg);

      } finally {
        setIsVerifying(false);
      }

      // try {
      //   // Build URL without double encoding
      //   const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/email/verify?token=${token}`;


      //   const response = await fetch(url, {
      //     method: 'GET',
      //     cache: 'no-store',
      //     headers: {
      //       'accept': 'application/json',
      //       'ngrok-skip-browser-warning': 'true'
      //     },
      //   });


      //   let data;
      //   try {
      //     data = await response.json();
      //   } catch (err) {
      //     console.error('Invalid JSON response received', err);
      //     setIsValidToken(false);
      //     setErrorMessage('Server returned an invalid response');
      //     setIsVerifying(false);
      //     return;
      //   }

      //   // Check for success - be more flexible with success conditions
      //   if (response.ok) {
      //     setIsValidToken(true);
      //     setErrorMessage('');
      //   } else {
      //     setIsValidToken(false);
      //     setErrorMessage(
      //       data?.message || 
      //       data?.error || 
      //       data?.detail || 
      //       `Verification failed with status ${response.status}`
      //     );
      //   }

      // } catch (error) {
      //   console.error('Verification Network Error', error);
      //   setIsValidToken(false);
      //   setErrorMessage('Network error. Please check your connection.');
      // } finally {
      //   setIsVerifying(false);
      // }
    };
    verifyEmail();
    window.history.replaceState({}, "", "/emailverify");
    // verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    router.push('/login');
  };

  // Loading State
  if (isVerifying) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Verifying your email...</p>
        </div>
      </div>
    );
  }

  // Invalid Token - Unauthorized Access
  if (!isValidToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="w-full max-w-md bg-white border border-red-200 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Verification Failed</h1>
          <div className="flex items-start gap-2 p-4 mb-6 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-left">
              {errorMessage || 'You have no authorization to access this page. The verification link is invalid or has expired.'}
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Please check your email for a valid verification link or request a new one.
          </p>
          <button
            onClick={handleGoToLogin}
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Valid Token - Success Message
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md bg-white border border-green-200 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Email Verified!</h1>
        <p className="text-gray-600 mb-8">
          Your email has been verified successfully. You can now login to your account.
        </p>
        <button
          onClick={handleGoToLogin}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}