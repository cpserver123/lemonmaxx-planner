'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoogleIcon from '@/components/icons/google';
import Logo from '@/components/logo';
import { ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, Zap, Shield, Users, Target, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaTelegramPlane } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Login() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 2FA State ──
  const [requires2FA, setRequires2FA] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── If already authenticated, redirect to dashboard ──
  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [auth.isAuthenticated, router]);

  // ── Timer countdown ──
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // ── Google OAuth callback handler ──
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (!code) return;

    const exchangeCode = async () => {
      try {
        const callbackUrl = `${API_BASE}/api/v1/auth/google/callback?code=${encodeURIComponent(code)}&state=planner`;

        const resp = await fetch(callbackUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });

        const contentType = resp.headers.get('content-type') || '';
        let payload: any;

        if (contentType.includes('application/json')) {
          payload = await resp.json();
        } else {
          const text = await resp.text();
          console.error('Google callback non-JSON response:', text);
          throw new Error('Unexpected response from Google auth endpoint (non-JSON).');
        }

        if (!resp.ok || !payload.success) {
          throw new Error(payload.message || 'Google authentication failed');
        }

        const token = payload?.data?.access_token;
        const user = payload?.data?.user || payload?.data?.profile;

        if (token) {
          auth.login(token, user || {});
          toast.success(payload?.message || 'Logged in with Google');
          router.push('/dashboard');
        }
      } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message;
        toast.error(msg || 'Google authentication failed');
      }
    };

    exchangeCode();
  }, []);

  // ── Post-login redirect logic ──
  const handlePostLoginRedirect = async (payload: any) => {
    try {
      toast.success(payload?.message || 'Login successful! Redirecting...');
      const token = payload.data.access_token;
      const user = payload.data.profile || payload.data.user || {};
      auth.login(token, user);
      router.push('/dashboard');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message;
      console.error(msg || 'Error during post-login redirect:');
    }
  };

  // ── Login handler ──
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields (Email and Password).');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/signin`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email, password, source: 'planner' }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Login failed. Please try again.');
      }

      // ── Check if 2FA is required ──
      if (payload.data?.requires_2fa) {
        setRequires2FA(true);
        setTimeLeft(payload.data.ttl || 30);
        setOtpCode(['', '', '', '', '', '']);
        setOtpError('');
        toast.info(payload.message || 'Verification code sent to your Telegram');
        return;
      }

      // ── No 2FA — proceed normally ──
      if (payload.data && payload.data.access_token) {
        await handlePostLoginRedirect(payload);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message;
      toast.error(msg || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Verify OTP ──
  const handleVerifyOTP = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setOtpError('Please enter the complete 6-digit code.');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/verify-totp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email, password, code, source: 'planner' }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        const errorMsg = payload.message || 'Verification failed. Please try again.';
        setOtpError(errorMsg);

        if (response.status === 401 && (
          errorMsg.toLowerCase().includes('expired') ||
          errorMsg.toLowerCase().includes('too many')
        )) {
          setOtpCode(['', '', '', '', '', '']);
          setTimeLeft(0);
        }
        return;
      }

      if (payload.data && payload.data.access_token) {
        await handlePostLoginRedirect(payload);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message;
      setOtpError(msg || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOTP = async () => {
    setIsResending(true);
    setOtpError('');

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/resend-totp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email, password, source: 'planner' }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        const errorMsg = payload.message || 'Failed to resend code.';
        setOtpError(errorMsg);
        if (errorMsg.toLowerCase().includes('not linked') || response.status === 400) {
          toast.error(errorMsg);
        }
        return;
      }

      setTimeLeft(payload.data?.ttl || 30);
      setOtpCode(['', '', '', '', '', '']);
      setOtpError('');
      toast.success(payload.message || 'Verification code resent!');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message;
      setOtpError(msg || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // ── Back to login form ──
  const handleBackToLogin = () => {
    setRequires2FA(false);
    setTimeLeft(0);
    setOtpCode(['', '', '', '', '', '']);
    setOtpError('');
    setIsVerifying(false);
    setIsResending(false);
  };

  // ── OTP input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...otpCode];
    newCode[index] = digit;
    setOtpCode(newCode);
    setOtpError('');
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyOTP();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...otpCode];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || '';
    }
    setOtpCode(newCode);
    const nextEmpty = newCode.findIndex(c => !c);
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIdx]?.focus();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isCodeComplete = otpCode.every(d => d !== '');

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/v1/auth/google/login?source=planner`;
  };

  // ── OTP Screen ──
  const renderOTPScreen = () => (
    <div className="bg-card border rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
          <Logo />
          <span className="text-xl font-bold text-foreground">Lemonmaxx</span>
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
            <FaTelegramPlane className="text-white text-3xl" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Verification Code Sent</h2>
        <p className="text-muted-foreground text-sm">
          We&apos;ve sent a 6-digit code to your Telegram.
          <br />
          Enter it below to complete sign in.
        </p>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          timeLeft > 10
            ? 'bg-primary/10 text-primary'
            : timeLeft > 0
            ? 'bg-amber-500/10 text-amber-600'
            : 'bg-red-500/10 text-red-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            timeLeft > 10 ? 'bg-primary animate-pulse' : timeLeft > 0 ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
          }`} />
          {timeLeft > 0 ? (
            <span>Code expires in <strong>{formatTime(timeLeft)}</strong></span>
          ) : (
            <span>Code expired</span>
          )}
        </div>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handleOtpPaste}>
        {otpCode.map((digit, idx) => (
          <input
            key={idx}
            ref={el => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(idx, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(idx, e)}
            autoFocus={idx === 0}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 bg-background transition-all duration-200 outline-none
              ${digit ? 'border-primary shadow-sm shadow-primary/20' : 'border-muted'}
              ${otpError ? 'border-red-400 shake' : ''}
              focus:border-primary focus:shadow-md focus:shadow-primary/20
              disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isVerifying}
          />
        ))}
      </div>

      {/* Error Message */}
      {otpError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
          {otpError}
        </div>
      )}

      {/* Verify Button */}
      <Button
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-lg font-semibold shadow-lg disabled:opacity-50"
        onClick={handleVerifyOTP}
        disabled={isVerifying || !isCodeComplete || timeLeft === 0}
      >
        {isVerifying ? (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Verifying...
          </span>
        ) : (
          <>
            Verify Code
            <ArrowRight className="ml-2 w-5 h-5" />
          </>
        )}
      </Button>

      {/* Resend & Back */}
      <div className="mt-6 space-y-3">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">Didn&apos;t receive the code? </span>
          <button
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-sm text-primary hover:text-primary/80 font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Resend Code
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleBackToLogin}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </div>
    </div>
  );

  // ── Login Form ──
  const renderLoginForm = () => (
    <div className="bg-card border rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
          <Logo />
          <span className="text-xl font-bold text-foreground">Lemonmaxx</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
        <p className="text-muted-foreground">Sign in to your account to continue with lemonmaxx</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Link href="/emailverify" className="text-sm text-primary hover:text-primary/80 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10 h-12 rounded-xl border-2 focus:border-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {password && password.length < 8 ? (
            <p className="text-xs text-red-500">Password must be at least 8 characters long</p>
          ) : (
            <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-lg font-semibold shadow-lg"
          onClick={handleLogin}
          disabled={isSubmitting}
        >
          Sign In
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-4 text-muted-foreground font-medium">Or continue with</span>
          </div>
        </div>

        <Button variant="outline" className="w-full h-12 rounded-xl border-2 hover:bg-muted/50"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon className="mr-3 h-5 w-5" />
          Continue with Google
        </Button>
      </form>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
      {/* Left Side - Branding */}
      <div className="hidden lg:block space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-2xl font-bold text-foreground">Lemonmaxx</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Welcome back to the
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Complete Marketing </span>
            Ecosystem
          </h1>
          <p className="text-xl text-muted-foreground">
            Continue managing your campaigns across Facebook, Google, TikTok, and more - all in one powerful platform.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Ad Management Control</h3>
              <p className="text-sm text-muted-foreground">Turn ads on/off, adjust budgets instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI-Powered Automation</h3>
              <p className="text-sm text-muted-foreground">Smart rules and instant WhatsApp alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card/50 rounded-xl border">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground"> Features</h3>
              <p className="text-sm text-muted-foreground">Features based on your selected plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form or OTP Screen */}
      <div className="w-full max-w-md mx-auto">
        {requires2FA ? renderOTPScreen() : renderLoginForm()}

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">Trusted by 10,000+ marketers worldwide</p>
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
