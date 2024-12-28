// src/components/layout/Footer.tsx

import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-4">
      <div className="container mx-auto text-center text-gray-600">
        <p>
          &copy; {new Date().getFullYear()} Voting System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
