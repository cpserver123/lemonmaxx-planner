"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import api from "@/app/utils/axios";
import { FaEye } from "react-icons/fa";
import { IoCloseCircleOutline } from "react-icons/io5";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useRouter } from "next/navigation";

/* Default profile placeholder */
const defaultProfilePic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 112 112' fill='%23999'%3E%3Ccircle cx='56' cy='56' r='56' fill='%23e5e7eb'/%3E%3Ccircle cx='56' cy='40' r='18' fill='%23999'/%3E%3Cellipse cx='56' cy='90' rx='30' ry='22' fill='%23999'/%3E%3C/svg%3E";


export default function ProfileDetails() {
  const router = useRouter();
  const { token: access_token, user, setUser, logout } = useAuth();

  const [data, setData] = useState({
    fullName: "",
    email: "",
    phone: "",
    profilePhoto: "",
    role: "user",
    media_buyer_code: "",
  });

  const [changed, setChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const roleLabel = (raw: any) => {
    const r = String(raw ?? "").toLowerCase();
    switch (r) {
      case "tl":
        return "Team Leader";
      case "ct_tl":
        return "Creative Team Leader";
      case "ct_user":
        return "Creative User";
      case "admin":
        return "Admin";
      case "superadmin":
        return "Superadmin";
      case "user":
        return "User";
      default:
        return r ? r.charAt(0).toUpperCase() + r.slice(1) : "User";
    }
  };
  useEffect(() => {
    if (user) {
      setData({
        fullName: user?.name || "",
        email: user?.email || "",
        phone: user?.number?.replace(/-/g, "") || "",
        profilePhoto: user?.profile_pic || "",
        role: user?.role || "user",
        media_buyer_code: user?.media_buyer_code || ""
      });
    }
  }, [user]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get("/api/v1/user/profile", {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        const result = response.data;
        if (result.success) {
          const u = result?.data?.user || result?.data?.profile;

          setData({
            fullName: u?.name,
            email: u?.email,
            phone: u?.number,
            profilePhoto: u?.profile_pic,
            role: u?.role,
            media_buyer_code: u?.media_buyer_code || "",
          });
          setUser(u);
        }
      } catch (error: any) {
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || error?.message || "Error fetching profile.";
        toast.error(msg);
        if (status === 404) {
          logout();
          return;
        }
      }
    }

    fetchProfile();
  }, [access_token]);

  const handleChange = (field: string, value: string) => {
    setChanged(true);
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const base64 = await convertToBase64(file);

    setData((prev: any) => ({ ...prev, profilePhoto: base64 }));
    setChanged(true);
  };

  const convertToBase64 = (file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const saveProfile = async () => {
    if (!data.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setLoading(true);


    try {
      const response = await api.patch(
        "/api/v1/user/profile",
        {
          name: data.fullName,
          number: data.phone,
          profile_pic: data.profilePhoto,
          media_buyer_code: data?.media_buyer_code,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
            'ngrok-skip-browser-warning': 'true'
          },
        }
      );

      const result = response.data;
      const u = result?.data?.user || result?.data?.profile;
      if (result.success) {
        toast.success("Profile updated successfully!");
        setChanged(false);
        setUser(u);
      } else {
        toast.error(result.message || "Failed to update profile.");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Error updating profile.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }

  };

  function formatPhone(number: any, dialCode?: string) {
    if (!number) return "";
    const digits = String(number).replace(/\D/g, "");
    const code = String(dialCode ?? "");
    const codeLen = code.length || 0;
    const mobile = digits.slice(codeLen);
    return codeLen ? `+${code}-${mobile}` : `+${digits}`;
  }


  const handlePhoneChange = (value: any, data: any) => {
    const raw = "+" + value; // e.g. +17021234567
    const formatted = formatPhone(raw, data?.dialCode); // +1-7021234567
    setData((prev) => ({
      ...prev,
      phone: formatted,
      countryCode: data?.dialCode,
      country: data?.countryCode,
    }));
    setChanged(true);
  };


  return (
    <>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-white dark:bg-gray-900 p-4">

          <div className="relative flex items-center gap-6">
            <div className="relative w-28 h-28">

              <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-md group cursor-pointer">
                <Image
                  src={data?.profilePhoto || defaultProfilePic}
                  alt="profile"
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaEye
                    className="text-white text-2xl"
                    onClick={() => setIsOpen(true)}
                  />
                </div>
              </div>
              {/* <div className="w-28 h-28 rounded-full overflow-hidden shadow-md">
              <Image
                src={data?.profilePhoto}
                alt="profile"
                width={112}
                height={112}
                className="object-cover"
              />
            </div> */}

              {/* Camera Button */}
              <label className="absolute bottom-1 right-1 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="w-8 h-8 bg-gray-800 text-white flex items-center justify-center rounded-full text-[14px]">
                  📷
                </div>
              </label>
            </div>

            <div>
              <input
                title={data?.fullName || "Enter your full name"}
                type="text"
                value={data.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent outline-none"
              />
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 bg-blue-500/20 text-blue-500 dark:text-blue-300">
                  {roleLabel(data?.role) || "User"}
                </span>
              </div>
            </div>

          </div>
          <div className="my-8 h-px bg-gray-200 dark:bg-gray-800"></div>

          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Full Name</span>
              <input
                title={data?.fullName || "Enter your full name"}
                type="text"
                value={data.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="text-base font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-700 outline-none"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-base font-medium text-gray-900 dark:text-white">
                {data.email}
              </span>
              <hr className="border-t-2 border-gray-300 dark:border-gray-800" />


            </div>




            <div
              className="flex flex-col">
              <span className="text-sm text-gray-500">Phone</span>
              <PhoneInput
                country={"us"}
                enableSearch
                value={data.phone}
                onChange={handlePhoneChange}
                containerClass="w-full phone-input-container"
                inputClass="phone-input"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Media Buyer Code</span>
              <input
                placeholder="(optional)"
                type="text"
                value={data?.media_buyer_code || ""}
                onChange={(e) => handleChange("media_buyer_code", e.target.value)}
                className="text-base font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-700 outline-none"
              />
            </div>

          </div>

          <div className="mt-10 flex items-center justify-between">
            <button
              disabled={!changed || loading}
              onClick={saveProfile}
              className={`px-6 py-2 rounded-lg text-white font-medium ${changed
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <Link
              href="/change-password"
              className="text-blue-600 font-medium text-sm hover:underline"
            >
              Change Password
            </Link>

          </div>
        </div>

        {isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full shadow-lg">
              <IoCloseCircleOutline
                size={30}
                onClick={() => setIsOpen(false)}
                className="text-gray absolute -top-3 -right-3"
              />
              <Image
                src={data?.profilePhoto || defaultProfilePic}
                alt="profile"
                width={384}
                height={384}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
