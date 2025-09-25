import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import ProfileDropdown from "@/components/ProfileDropdown";

const Layout = async ({ children }: { children: ReactNode }) => {
  console.log("Checking authentication in root layout...");
  const user = await getCurrentUser();
  console.log("User authenticated:", !!user);
  
  if (!user) {
    console.log("User not authenticated, redirecting to sign-in");
    redirect("/sign-in");
  }

  return (
    <div className="root-layout">
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="MockMate Logo" width={38} height={32} />
          <h2 className="text-primary-100">MockMate</h2>
        </Link>
        
        <ProfileDropdown user={user} />
      </nav>

      {children}
    </div>
  );
};

export default Layout;