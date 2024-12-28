// src/app/election/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import CreateElectionForm from "@/components/election/create/CreateElectionForm";
import { Toaster } from "sonner";

export default function CreateElectionPage() {
  const router = useRouter();

  return (
    <>
      <Toaster richColors position="top-center" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="group flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Elections
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Election</CardTitle>
            <p className="text-sm text-gray-500">
              Set up your election details, add candidates, and configure voting rules.
            </p>
          </CardHeader>
          <CardContent>
            <CreateElectionForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}