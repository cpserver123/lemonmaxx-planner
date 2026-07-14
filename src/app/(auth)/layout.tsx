import Link from 'next/link';
import Logo from '@/components/logo';
import { ArrowLeft } from 'lucide-react';
import { ToastContainer } from 'react-toastify';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between p-6">
        {/* <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to home</span>
        </Link> */}
        {/* <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Need help?</span>
          <Link href="/support" className="text-sm text-primary hover:text-primary/80 font-medium">
            Contact Support
          </Link>
        </div> */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-88px)] p-6">
        {children}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>

      {/* Footer */}
      <div className="relative z-20 text-center p-6 border-t bg-card/50 backdrop-blur">
        <p className="text-xs text-muted-foreground">
          © 2025 Lemonmaxx Planner. All rights reserved. {' '}
          {/* <Link href="/terms-of-service" className="hover:text-foreground">Terms of Service</Link> |{' '}
          <Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link> */}
        </p>
      </div>
    </div>
  );
}
