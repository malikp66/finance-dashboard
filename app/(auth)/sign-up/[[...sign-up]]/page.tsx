import { SignUp, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const SignUpPage = () => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="h-full flex-col items-center justify-center px-4 lg:flex">
        <div className="space-y-4 pt-16 text-center">
          <h1 className="text-3xl font-bold text-[#2E2A47]">Selamat datang kembali!</h1>
          <p className="text-base text-[#7E8CA0]">
            Masuk atau buat akun untuk kembali ke dashboard Anda.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <ClerkLoaded>
                <SignUp path="/sign-up" />
              </ClerkLoaded>

              <ClerkLoading>
                <Loader2 className="animate-spin text-muted-foreground" />
              </ClerkLoading>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="hidden h-full items-center justify-center bg-blue-600 lg:flex">
        <Image src="/logo.svg" alt="Business logo" height={100} width={100} />
      </div>
    </div>
  );
};

export default SignUpPage;
