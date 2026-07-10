"use client";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function EmailVerified() {
    const router = useRouter();
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="w-full max-w-md bg-white border border-green-200 rounded-3xl p-8 shadow-2xl text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-gray-600 mb-8">
                    We’ve sent a verification email. Please check your inbox to complete the authorization process.
                </p>

                <button
                    onClick={() => router.push("/login")}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    Go to Login
                </button>
            </div>
        </div>
    );
}
