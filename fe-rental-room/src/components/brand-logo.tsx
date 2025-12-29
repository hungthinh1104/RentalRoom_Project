import Link from "next/link";
import { Building2 } from "lucide-react";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/dashboard/admin" className={`flex items-center gap-2 flex-shrink-0 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md">
        <Building2 className="w-5 h-5" />
      </div>
      <span className="hidden sm:inline-block font-bold text-lg bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
        RentalRoom
      </span>
    </Link>
  );
}

export default BrandLogo;
