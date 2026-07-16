import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { Providers } from "./providers";
import AuthGuard from "@/components/AuthGuard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <Providers>
        <div className="flex min-h-screen">
          <Sidebar />
          <div
            className="flex-1 min-w-0 bg-[#F3F4F6] dark:bg-[#020d1a] flex flex-col h-screen overflow-hidden"
          >
            <Header />
            <main className="mx-auto w-full flex-1 overflow-y-auto p-4 md:p-6 2xl:p-10">
              {children}
            </main>
          </div>
        </div>
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
          theme="dark"
        />
      </Providers>
    </AuthGuard>
  );
}
