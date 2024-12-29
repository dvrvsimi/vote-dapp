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
      
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="group flex items-center text-white hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </button>

          <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Create New Election
              </CardTitle>
              <p className="text-black/70">
                Set up your election details, add candidates, and configure voting rules.
              </p>
            </CardHeader>
            <CardContent>
              <CreateElectionForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}