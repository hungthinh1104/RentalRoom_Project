"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PropertyForm } from "@/features/properties/components/property-form";
import { PropertyInput } from "@/features/properties/schemas";
import { useState } from "react";
import { toast } from "sonner";
import { propertiesApi } from "@/features/properties/api/properties-api";
import { Loader2 } from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PropertyInput) => {
    console.debug('[NewPropertyPage] handleSubmit called', data);
    if (!session?.user?.id) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setIsLoading(true);
    try {
      console.debug('[NewPropertyPage] creating property', { data, landlordId: session.user.id });
      const property = await propertiesApi.create({ ...data, landlordId: session.user.id });
      console.debug('[NewPropertyPage] create successful', property);
      toast.success("Bất động sản được tạo thành công!");
      
      // Redirect to rooms page
      router.push(`/dashboard/landlord/properties/${property.id}/rooms`);
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo bất động sản"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.id) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <PropertyForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isEdit={false}
        landlordId={session.user.id}
      />
    </div>
  );
}
