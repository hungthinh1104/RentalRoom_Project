"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PropertyForm } from "@/features/properties/components/property-form";
import { PropertyInput } from "@/features/properties/schemas";
import type { Property } from '@/types';
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { propertiesApi } from "@/features/properties/api/properties-api";
import { Loader2 } from "lucide-react";

import { use } from "react";
// ... other imports

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!session?.user?.id) return;

      setIsFetching(true);
      try {
        const data = await propertiesApi.getById(id);
        setProperty(data);
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Không thể tải bất động sản");
      } finally {
        setIsFetching(false);
      }
    };

    fetchProperty();
    fetchProperty();
  }, [session?.user?.id, id]);

  const handleSubmit = async (data: PropertyInput) => {
    if (!session?.user?.id) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    setIsLoading(true);
    try {
      await propertiesApi.update(id, data);

      toast.success("Bất động sản được cập nhật thành công!");
      router.push("/dashboard/landlord/properties");
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật bất động sản"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.id || isFetching) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-96">
          <p className="text-muted-foreground">Không tìm thấy bất động sản</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <PropertyForm
        defaultValues={{
          ...property,
          description: property.description ?? undefined,
          cityCode: property.cityCode ?? undefined,
          wardCode: property.wardCode ?? undefined,
        }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isEdit={true}
        landlordId={session.user.id}
      />
    </div>
  );
}
