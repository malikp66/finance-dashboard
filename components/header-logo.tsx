import Image from "next/image";
import Link from "next/link";

export const HeaderLogo = () => {
  return (
    <Link href="/">
      <div className="hidden items-center lg:flex">
        <p className="ml-2.5 text-2xl font-semibold text-white">MYZ Finance</p>
      </div>
    </Link>
  );
};
