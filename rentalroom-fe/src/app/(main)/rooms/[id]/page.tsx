"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Maximize,
  Users,
  DollarSign,
  ShieldCheck,
  Phone,
  Mail,
  Star,
  ArrowLeft,
  Heart,
  Share2,
} from "lucide-react";
import { useRoom } from "@/features/rooms/hooks/use-rooms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoomAmenities } from "@/features/rooms/components/room-amenities";
import { RoomStatus } from "@/types/enums";
import type { RoomReview, RoomImage } from '@/types';
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { ContactLandlordModal } from "@/features/contracts/components/contact-landlord-modal";
import { favoritesApi } from "@/lib/api/favorites-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface RoomDetailPageProps {
  params: {
    id: string;
  };
}

export default function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = use(params as unknown as Promise<{ id: string }>);
  const { requireLogin } = useRequireAuth();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: room, isLoading, error } = useRoom(id);
  const [mainImage, setMainImage] = useState<string>("");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Fetch favorites to check if current room is bookmarked
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getAll(),
    enabled: !!session?.user,
  });

  const isBookmarked = favorites.some((fav: any) => fav.roomId === id);

  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: () => favoritesApi.toggle({ roomId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(isBookmarked ? "Đã bỏ yêu thích" : "Đã thêm vào yêu thích");
    },
    onError: () => {
      toast.error("Không thể cập nhật yêu thích");
    },
  });

  const handleBookmark = () => {
    if (requireLogin(`/rooms/${id}`)) {
      bookmarkMutation.mutate();
    }
  };

  const handleApply = () => {
    if (requireLogin(`/rooms/${id}`)) {
      setIsContactModalOpen(true);
    }
  };

  const handleContact = () => {
    if (requireLogin(`/rooms/${id}`)) {
      setIsContactModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !room) {
    return notFound();
  }

  const displayImage = mainImage ||
    room.images?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop";

  const isAvailable = room.status === RoomStatus.AVAILABLE;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <Link href="/rooms" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" />
        Quay lại danh sách phòng
      </Link>

      {/* Main Image */}
      <div className="relative h-96 w-full rounded-3xl overflow-hidden bg-muted">
        <Image
          src={displayImage}
          alt={`Room ${room.roomNumber}`}
          fill
          className="object-cover"
          priority
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">Không có sẵn</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-6 right-6">
          <Badge variant={isAvailable ? "default" : "secondary"} className="text-base py-1.5 px-4">
            {room.status === RoomStatus.AVAILABLE
              ? "Có sẵn"
              : room.status === RoomStatus.OCCUPIED
                ? "Đã cho thuê"
                : room.status === RoomStatus.UNAVAILABLE
                  ? "Bảo trì"
                  : room.status === RoomStatus.DEPOSIT_PENDING
                    ? "Đã đặt cọc"
                    : String(room.status)}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-6 right-6 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleBookmark}
            className={isBookmarked ? "bg-primary text-primary-foreground" : ""}
            title="Thêm vào yêu thích"
          >
            <Heart className={`size-5 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
          <Button size="icon" variant="secondary">
            <Share2 className="size-5" />
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {room.images && room.images.length > 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Thư viện ảnh</h3>
          <div className="grid grid-cols-4 gap-3">
            {room.images
              .filter((img: RoomImage) => !!img.imageUrl)
              .map((img: RoomImage, index: number) => (
                <button
                  key={img.id || index}
                  onClick={() => setMainImage(img.imageUrl)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${mainImage === img.imageUrl
                    ? "border-primary"
                    : "border-muted hover:border-muted-foreground"
                    }`}
                >
                  <Image
                    src={img.imageUrl}
                    alt="Phòng - thư viện ảnh"
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Phòng {room.roomNumber}</CardTitle>
              <p className="text-muted-foreground flex items-center gap-2 mt-2">
                <MapPin className="size-4" />
                {room.property?.address || "Vị trí chưa xác định"}
              </p>
            </CardHeader>
            <CardContent className="px-5 space-y-6">
              {/* Key Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Diện tích</p>
                  <p className="text-lg font-semibold flex items-center gap-1">
                    <Maximize className="size-5 text-primary" />
                    {room.area} m²
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tối đa người</p>
                  <p className="text-lg font-semibold flex items-center gap-1">
                    <Users className="size-5 text-primary" />
                    {room.maxOccupants || 1}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Giá thuê / tháng</p>
                  <p className="text-lg font-semibold flex items-center gap-1 text-primary">
                    <DollarSign className="size-5" />
                    {room.pricePerMonth.toLocaleString()} đ
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tiền cọc</p>
                  <p className="text-lg font-semibold flex items-center gap-1">
                    <ShieldCheck className="size-5 text-primary" />
                    {room.deposit.toLocaleString()} đ
                  </p>
                </div>
              </div>

              {/* Description */}
              {room.description && (
                <div>
                  <h4 className="font-semibold mb-2">Mô tả</h4>
                  <p className="text-muted-foreground leading-relaxed">{room.description}</p>
                </div>
              )}

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4">Tiện ích</h4>
                  <RoomAmenities amenities={room.amenities} />
                </div>
              )}

              {/* Reviews Section */}
              {room.reviews && room.reviews.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4">Đánh giá</h4>
                  <div className="space-y-3">
                    {room.reviews.slice(0, 3).map((review: RoomReview) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">
                              {review.tenant?.user?.fullName || "Ẩn danh"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`size-4 ${i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Landlord Info */}
          {room.property?.landlord && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chủ nhà</CardTitle>
              </CardHeader>
              <CardContent className="px-5 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-semibold">
                    {room.property.landlord.user?.fullName || "Không rõ"}
                  </p>
                </div>
                {room.property.landlord.user?.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-primary" />
                    <a
                      href={`tel:${room.property.landlord.user.phoneNumber}`}
                      className="text-primary hover:underline text-sm"
                    >
                      {room.property.landlord.user.phoneNumber}
                    </a>
                  </div>
                )}
                {room.property.landlord.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <a
                      href={`mailto:${room.property.landlord.user.email}`}
                      className="text-primary hover:underline text-sm"
                    >
                      {room.property.landlord.user.email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full h-12 text-base"
              disabled={!isAvailable}
              onClick={handleApply}
            >
              Đăng ký thuê
            </Button>
            <Button variant="outline" className="w-full h-12" onClick={handleContact}>
              <Phone className="size-4 mr-2" />
              Liên hệ chủ nhà
            </Button>
          </div>

          {/* Property Info */}
          {room.property && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tài sản</CardTitle>
              </CardHeader>
              <CardContent className="px-5 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Tên:</span>{" "}
                  <span className="font-medium">{room.property.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Loại:</span>{" "}
                  <span className="font-medium capitalize">
                    {(room.property?.propertyType
                      ? room.property.propertyType.toLowerCase().replace(/_/g, " ")
                      : "Không rõ")}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Tổng số phòng:</span>{" "}
                  <span className="font-medium">{room.property.totalRooms}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Thành phố:</span>{" "}
                  <span className="font-medium">{room.property.city}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Contact Landlord Modal */}
      <ContactLandlordModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        roomId={id}
        roomName={`Phòng ${room?.roomNumber}`}
        landlordId={room?.property?.landlord?.user?.id}
        landlordName={room?.property?.landlord?.user?.fullName || "Chủ nhà"}
      />
    </div>
  );
}
