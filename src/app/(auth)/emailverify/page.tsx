"use client"
import api from '@/app/utils/axios';
import React, { useState } from 'react';

export default function EmailVerify() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); // specific state to handle color

  const handleSend = async () => {
    // 1. Basic client-side validation
    if (!email) {
      setMessage('Please enter a valid email address.');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      // 2. API Call
      // 'https://53f2c4ffedeb.ngrok-free.app/api/v1/auth/password/forgot'
      // const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/password/forgot`, {
      //   method: 'POST',
      //   headers: {
      //     'accept': 'application/json',
      //     'Content-Type': 'application/json',
      //     // 'ngrok-skip-browser-warning': 'true' // Uncomment this if you get an ngrok warning page
      //   },
      //   body: JSON.stringify({
      //     identifier: email // API expects "identifier"
      //   })
      // });

      // const data = await response.json();

      const response = await api.post(`/api/v1/auth/password/forgot`,
        { identifier: email },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            'ngrok-skip-browser-warning': 'true'
          },
        }
      );
      const data = response.data;
      // 3. Handle Response
      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message); // "If an account exists..."
      } else {
        setIsSuccess(false);
        setMessage(data.message || "Failed to send verification.");
      }

    } catch (error: any) {
      console.error("Error sending email:", error);
      const msg = error?.response?.data?.message || error?.message;
      setIsSuccess(false);
      setMessage(msg || "Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020817] px-4 w-full">
      <div
        className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-black"
        style={{ color: 'black' }}
      >
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Email Verify</h1>
        <p className="text-center text-gray-600 mb-8">
          Enter your email address below and we will send you a link to verify your account.
        </p>

        {/* Input Field */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Button */}
        <button
          onClick={handleSend}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition duration-200 ${isLoading
            ? 'cursor-not-allowed opacity-70'
            : 'hover:shadow-lg'
            }`}
          style={{ background: isLoading ? '#a07ae0' : '#7c3bedcc' }}
        >
          {isLoading ? 'Sending...' : 'Send verification URL to email'}
        </button>

        {/* Feedback Message */}
        {message && (
          <div className={`mt-4 text-center text-sm ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}