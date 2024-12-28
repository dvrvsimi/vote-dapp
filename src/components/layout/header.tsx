"use client";

import { useRouter } from "next/navigation";
import { Menu, Settings, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ClusterUiSelect } from "@/components/cluster/cluster-ui";
import { useUserVerification } from "@/hooks/useUserVerification";
import { useWallet } from "@solana/wallet-adapter-react";

const Header = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { publicKey } = useWallet();
  const { fetchVerification } = useUserVerification();

  // Check verification status when wallet changes
  useEffect(() => {
    const checkVerification = async () => {
      if (!publicKey) {
        setIsVerified(false);
        return;
      }

      const verification = await fetchVerification(publicKey);
      setIsVerified(!!verification?.isVerified);
    };

    checkVerification();
  }, [publicKey, fetchVerification]);

  const navigation = [
    { name: "Home", href: "/" },
    {
      name: isVerified ? "Verified" : "Verify",
      href: "/verify",
      disabled: isVerified,
    },
  ];

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div onClick={() => router.push("/")} className="cursor-pointer">
              <Image 
                src="/logo.png"
                alt="elect.io"
                width={40}
                height={40}
                className="w-auto h-8"
                priority
              />
            </div>
            <div className="ml-8 space-x-8 hidden md:flex">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => !item.disabled && router.push(item.href)}
                  className={`text-base font-medium ${
                    item.disabled
                      ? "text-green-600 cursor-default"
                      : "text-gray-700 hover:text-purple-600 transition-colors"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <Settings className="h-5 w-5" />
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Wallet connection and Cluster Selection */}
            <div className="hidden md:flex items-center space-x-4">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 text-sm" />
              <ClusterUiSelect />
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-50">
              <div className="flex flex-col space-y-4 p-4">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (!item.disabled) {
                        router.push(item.href);
                        setIsMenuOpen(false);
                      }
                    }}
                    className={`text-base font-medium ${
                      item.disabled
                        ? "text-green-600 cursor-default"
                        : "text-gray-700 hover:text-purple-600 transition-colors"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
                <div className="pt-4 space-y-4">
                  <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 text-sm w-full" />
                  <ClusterUiSelect />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;