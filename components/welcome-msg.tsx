"use client";

import { useUser } from "@clerk/nextjs";

export const WelcomeMsg = () => {
  const { user, isLoaded } = useUser();

  return (
    <div className="mb-4 space-y-2">
      <h2 className="text-2xl font-medium text-white lg:text-4xl">
        Selamat datang kembali{isLoaded ? ", " : " "}
        {user?.username} 👋
      </h2>
      <p className="text-sm text-[#89B6FD] lg:text-base">
        Ini adalah ringkasan laporan keuangan Anda.
      </p>
    </div>
  );
};
