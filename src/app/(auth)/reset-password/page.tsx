'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '@/app/utils/axios';

export default function ResetPassword() {
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(searchParams.get('token'));

  // States for page logic
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // To show API errors on submit

  // 1. Verify Token on Page Load (GET)
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setIsValidToken(false);
        return;
      }


      // `https://53f2c4ffedeb.ngrok-free.app/api/v1/auth/password/reset/verify?token=${encodeURIComponent(token)}`
      // try {
      //   const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/password/reset/verify?token=${encodeURIComponent(token)}`, {
      //       method: 'GET',
      //       cache: 'no-store',
      //       headers: {
      //         'accept': 'application/json',
      //         'ngrok-skip-browser-warning': 'true'
      //       },
      //   });

      //   let data;
      //   try {
      //       data = await response.json();
      //   } catch (err) {
      //       console.error("HTML/Ngrok error page received.", err);
      //       setIsValidToken(false);
      //       setIsVerifying(false);
      //       return;
      //   }

      //   if (response.ok && data.status_code === 200) {
      //     setIsValidToken(true);
      //   } else {
      //     setIsValidToken(false); 
      //   }

      // } catch (error) {
      //   console.error("Verification Network Error", error);
      //   setIsValidToken(false);
      // } finally {
      //   setIsVerifying(false);
      // }

      try {
        setIsVerifying(true);

        const response = await api.get(
          `/api/v1/auth/password/reset/verify`,
          {
            params: {
              token: token, // axios encodes automatically
            },
            headers: {
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        const data = response.data;

        // SUCCESS
        if (data.status_code === 200) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }

      } catch (error: any) {
        console.error("Verification Error:", error);

        // Some ngrok errors return HTML → Axios throws JSON parse error
       
        const message =
          error.response?.data?.message || error?.message ||
          "Invalid or expired token";


        setIsValidToken(false);

      } finally {
        setIsVerifying(false);
      }


    };

    verifyToken();
    window.history.replaceState({}, "", "/reset-password");
  }, [token]);

  // 2. Handle the Password Reset Submit (POST)
  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    // try {
    //   // Fetch the POST API
    //   // 'https://53f2c4ffedeb.ngrok-free.app/api/v1/auth/password/reset'

    //   const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/password/reset`, {
    //     method: 'POST',
    //     headers: {
    //       'accept': 'application/json',
    //       'Content-Type': 'application/json',
    //       'ngrok-skip-browser-warning': 'true' // Important for ngrok
    //     },
    //     body: JSON.stringify({
    //       token: token,          // Token from URL
    //       new_password: newPassword // Password from input
    //     })
    //   });

    //   let data;
    //   try {
    //     data = await response.json();
    //   } catch (e) {
    //     setErrorMessage("Server returned an invalid response.");
    //     setIsSubmitting(false);
    //     return;
    //   }

    //   // Check response
    //   if (response.ok && (data.success || data.status_code === 200)) {
    //     setIsSuccess(true);
    //   } else {
    //     // Show error from API (e.g. "Invalid or expired token")
    //     setErrorMessage(data.message || "Failed to reset password. Please try again.");
    //   }

    // } catch (error) {
    //   console.error("Submit error:", error);
    //   setErrorMessage("Network error. Please check your connection.");
    // } finally {
    //   setIsSubmitting(false);
    // }


    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await api.post(
        `/api/v1/auth/password/reset`,
        {
          token: token,
          new_password: newPassword,
        },
        {
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      const data = response.data;

      // SUCCESS
      if (data.success || data.status_code === 200) {
        setIsSuccess(true);
      } else {
        setErrorMessage(data.message || "Failed to reset password. Please try again.");
      }

    } catch (error: any) {
      console.error("Reset Password Error:", error);

      const msg =
        error.response?.data?.message ||error?.message ||
        "Network error. Please check your connection.";

      setErrorMessage(msg);

    } finally {
      setIsSubmitting(false);
    }

  };

  // --- UI RENDER ---

  // A. Loading State
  if (isVerifying) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying security token...</p>
        </div>
      </div>
    );
  }

  // B. Invalid Token Error
  if (!isValidToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 bg-[#020817]">
        <div className="w-full max-w-md bg-white border rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-black">Authentication Failed</h1>
          <p className="text-muted-foreground mb-6">
            The link is invalid or expired. Please check your email and try again.
          </p>
          <Link href="/login">
            <Button className="w-full h-12 rounded-xl">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // C. Valid Token (Form or Success Message)
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 bg-[#020817]">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center justify-center gap-2 mb-8">
          <h1 className="text-2xl font-bold text-foreground mt-4">Set New Password</h1>
          <p className="text-sm text-muted-foreground text-center">
            Create a strong password for your account
          </p>
        </div>

        <div className="bg-white border rounded-3xl p-8 shadow-xl">

          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-black">Password Updated!</h3>
                <p className="text-sm text-muted-foreground mb-[1rem]">
                  Your password has been successfully changed.
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full h-12 rounded-xl">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pl-10 pr-10 h-12 rounded-xl border-2 focus:border-primary"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    suppressHydrationWarning={true}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-lg font-semibold shadow-lg transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Reset Password
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}