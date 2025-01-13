"use client";

import { useRouter } from "next/navigation";
import { Menu, Settings, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ClusterUiSelect } from "@/components/cluster/cluster-ui";
import { useUserVerification } from "@/hooks/useUserVerification";
import { useAppKitAccount } from '@reown/appkit/react';
import { WalletConnection } from "@/components/wallet/wallet-connection";
import { PublicKey } from '@solana/web3.js';

interface NavigationItem {
  name: string;
  href: string;
  disabled: boolean;
  hidden?: boolean;
}

const Header = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const { address } = useAppKitAccount();
  const { fetchVerification } = useUserVerification();


  // Log address changes
  useEffect(() => {
    console.log("Address changed:", address);
  }, [address]);

  // Check verification status when wallet changes
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        if (!address) {
          console.log("No address found, setting isVerified to false");
          setIsVerified(false);
          return;
        }

        console.log("Converting address to PublicKey:", address);
        const publicKey = new PublicKey(address);

        console.log("Fetching verification for address:", publicKey.toString());
        const verificationResult = await fetchVerification(publicKey);
        console.log("Verification result:", verificationResult);


        const newVerificationStatus = !!verificationResult?.isVerified;
        console.log("Setting isVerified to:", newVerificationStatus);
        setIsVerified(newVerificationStatus);
      } catch (error) {
        console.error('Verification check failed:', error);
        setIsVerified(false);
      }
    };

    checkVerificationStatus();
  }, [address, fetchVerification]);

  // Log whenever isVerified changes
  useEffect(() => {
    console.log("isVerified state changed to:", isVerified);
  }, [isVerified]);


  // Log navigation state
  useEffect(() => {
    console.log("Navigation items:", navigation.map(item => ({
      name: item.name,
      hidden: item.hidden,
      disabled: item.disabled
    })));
  }, [isVerified]);

  const navigation: NavigationItem[] = [
    { 
      name: "Home", 
      href: "/",
      disabled: false 
    },
    {
      name: "Create Election",
      href: "/election/create",
      disabled: !isVerified,
      hidden: !isVerified,
    },
    {
      name: isVerified ? "Verified" : "Verify",
      href: "/verify",
      disabled: isVerified,
    },
  ];

  const handleNavigation = (href: string, disabled: boolean) => {
    if (!disabled) {
      router.push(href);
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-3 flex items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div 
              onClick={() => router.push("/")} 
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && router.push("/")}
            >
              <Image 
                src="/logo.png"
                alt="elect.io"
                width={90}
                height={90}
                className="w-auto h-12"
                priority
              />
            </div>
            <div className="ml-8 space-x-8 hidden md:flex">
              {navigation.map((item) => (
                !item.hidden && (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href, item.disabled)}
                    disabled={item.disabled}
                    className={`text-base font-medium ${
                      item.disabled
                        ? "text-green-600 cursor-default"
                        : "text-gray-700 hover:text-purple-600 transition-colors"
                    }`}
                  >
                    {item.name}
                  </button>
                )
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                aria-expanded={isMenuOpen}
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Wallet connection and Cluster Selection */}
            <div className="hidden md:flex items-center space-x-4">
              <WalletConnection />
              <ClusterUiSelect />
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-50">
              <div className="flex flex-col space-y-4 p-4">
                {navigation.map((item) => (
                  !item.hidden && (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href, item.disabled)}
                      disabled={item.disabled}
                      className={`text-base font-medium ${
                        item.disabled
                          ? "text-green-600 cursor-default"
                          : "text-gray-700 hover:text-purple-600 transition-colors"
                      }`}
                    >
                      {item.name}
                    </button>
                  )
                ))}
                <div className="pt-4 space-y-4">
                  <WalletConnection />
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