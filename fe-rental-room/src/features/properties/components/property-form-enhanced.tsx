"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyType } from "@/types/enums";
import { propertySchema, type PropertyInput } from "../schemas";
import { PROPERTY_TYPE_LABELS } from "../constants";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PropertyFormEnhancedProps {
  defaultValues?: Partial<PropertyInput>;
  onSubmit: (data: PropertyInput) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const vietneseCities = [
  "Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Bình Dương",
  "Đồng Nai",
  "Bắc Ninh",
  "Hà Nam",
];

const wardsByCity: Record<string, string[]> = {
  "Hồ Chí Minh": [
    "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
    "Quận 6", "Quận 7", "Quận 8", "Quận 9", "Quận 10",
    "Quận 11", "Quận 12", "Bình Thạnh", "Gò Vấp", "Phú Nhuận",
    "Tân Bình", "Tân Phú", "Thủ Đức", "Bình Tân"
  ],
  "Hà Nội": [
    "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Cầu Giấy", "Thanh Xuân",
    "Hoàng Mai", "Tây Hồ", "Long Biên", "Bắc Từ Liêm", "Nam Từ Liêm",
    "Hà Đông", "Gia Lâm", "Thanh Trì", "Sóc Sơn", "Đông Anh"
  ],
};

export function PropertyFormEnhanced({
  defaultValues,
  onSubmit,
  isLoading,
  isEdit = false,
}: PropertyFormEnhancedProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      ward: "",
      propertyType: PropertyType.APARTMENT,
      ...defaultValues,
    } as PropertyInput,
  });

  const selectedCity = useWatch({ control, name: "city" }) as string | undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Chỉnh sửa bất động sản" : "Thêm bất động sản mới"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {isEdit 
            ? "Cập nhật thông tin bất động sản của bạn"
            : "Điền đầy đủ thông tin để thêm bất động sản mới vào hệ thống"}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              <CardDescription>Tên và loại bất động sản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">
                  Tên bất động sản *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Nhà trọ Ánh Dương"
                  disabled={isLoading}
                  className={cn(errors.name && "border-destructive")}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message as string}</p>
                )}
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <Label htmlFor="propertyType" className="font-medium">
                  Loại bất động sản *
                </Label>
                <Select
                  defaultValue={defaultValues?.propertyType || PropertyType.APARTMENT}
                  onValueChange={(value) => setValue("propertyType", value as PropertyType)}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PropertyType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {PROPERTY_TYPE_LABELS[type as PropertyType]}
                      </SelectItem>
                    ))} 
                  </SelectContent>
                </Select>
                {errors.propertyType && (
                  <p className="text-sm text-destructive">{errors.propertyType.message as string}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Địa chỉ
              </CardTitle>
              <CardDescription>Vị trí chi tiết của bất động sản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="font-medium">
                  Địa chỉ chi tiết *
                </Label>
                <Input
                  id="address"
                  placeholder="e.g. 123 Nguyễn Huệ"
                  disabled={isLoading}
                  className={cn(errors.address && "border-destructive")}
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message as string}</p>
                )}
              </div>

              {/* City - Ward */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="font-medium">
                    Thành phố *
                  </Label>
                  <Select
                    defaultValue={defaultValues?.city || ""}
                    onValueChange={(value) => {
                      setValue("city", value);
                      setValue("ward", "");
                    }}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Chọn thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      {vietneseCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message as string}</p>
                  )}
                </div>

                {/* Ward */}
                <div className="space-y-2">
                  <Label htmlFor="ward" className="font-medium">
                    Phường/Xã *
                  </Label>
                  <Select
                    defaultValue={defaultValues?.ward || ""}
                    disabled={!selectedCity}
                    onValueChange={(value) => setValue("ward", value)}
                  >
                    <SelectTrigger id="ward">
                      <SelectValue placeholder={selectedCity ? "Chọn phường/xã" : "Chọn thành phố trước"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCity && wardsByCity[selectedCity]?.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ward && (
                    <p className="text-sm text-destructive">{errors.ward.message as string}</p>
                  )}
                </div>

                {/* (ward select above used for ward selection) */}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 pt-4"
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Cập nhật" : "Thêm bất động sản"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
