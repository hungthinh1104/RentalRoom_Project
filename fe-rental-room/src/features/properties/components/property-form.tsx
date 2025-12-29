"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PropertyType } from "@/types/enums";
import { propertySchema, type PropertyInput } from "../schemas";
import {
  PROPERTY_TYPE_LABELS,
} from "../constants";
import { getProvinceNames, getWardNamesByProvinceName } from "@/lib/data/vietnam-geo";
import {
  Building2,
  MapPin,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface PropertyFormProps {
  defaultValues?: Partial<PropertyInput>;
  onSubmit: (data: PropertyInput) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
  landlordId: string;
}

export function PropertyForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  isEdit = false,
  landlordId,
}: PropertyFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCity, setSelectedCity] = useState<string>(
    defaultValues?.city || ""
  );
  const [wardOptions, setWardOptions] = useState<string[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    control,
    getValues,
    formState: { errors },
  } = useForm<PropertyInput>({

    resolver: zodResolver(propertySchema),
    defaultValues: {
      landlordId,
      name: "",
      address: "",
      city: "",
      ward: "",
      propertyType: PropertyType.APARTMENT,
      description: "",
      ...defaultValues,
    },
  });

  const propertyType = useWatch({ control, name: "propertyType", defaultValue: defaultValues?.propertyType || PropertyType.APARTMENT }) as PropertyType;
  const ward = useWatch({ control, name: "ward" }) as string | undefined;
  const nameField = useWatch({ control, name: "name" }) as string | undefined;

  // Load districts when city changes (async lazy loading)
  const loadWards = async (cityName: string) => {
    if (!cityName) {
      setWardOptions([]);
      return;
    }
    
    setLoadingWards(true);
    try {
      const wards = await getWardNamesByProvinceName(cityName);
      setWardOptions(wards);
    } catch (error) {
      console.error('Failed to load wards:', error);
      setWardOptions([]);
    } finally {
      setLoadingWards(false);
    }
  };

  // Load districts when selectedCity changes
  useEffect(() => {
    if (selectedCity) {
      loadWards(selectedCity);
    }
  }, [selectedCity]);

  const handleNext = () => {
    const nameFieldLocal = getValues("name");
    const propertyTypeField = getValues("propertyType");

    if (nameFieldLocal && propertyTypeField) {
      setStep(2);
    }
  };

  const handleSubmitForm = async (data: PropertyInput) => {
    console.debug('[PropertyForm] submit start', data);
    // Show lightweight feedback immediately
    try {
      await onSubmit(data);
      console.debug('[PropertyForm] submit finished');
    } catch (err) {
      console.error('[PropertyForm] submit error', err);
      // Import sonner toast dynamically to avoid adding it to the bundle if not used elsewhere
      try {
        const { toast } = await import('sonner');
        toast.error((err instanceof Error && err.message) || 'Lỗi khi gửi dữ liệu');
      } catch {
        // ignore
      }
      throw err;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? "Chỉnh sửa bất động sản" : "Thêm bất động sản mới"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? "Cập nhật thông tin chi tiết của bất động sản"
                : "Điền thông tin bất động sản của bạn. Sau đó bạn có thể thêm phòng."}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-6">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all",
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-success text-success-foreground"
            )}
          >
            1
          </div>
          <div className="flex-1 h-1 bg-border" />
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all",
              step === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            2
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Thông tin cơ bản</span>
          <span>Địa chỉ & chi tiết</span>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                <CardDescription>
                  Tên và loại hình bất động sản
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="font-semibold">
                    Tên bất động sản
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="ví dụ: Nhà trọ Ánh Dương"
                    disabled={isLoading}
                    className={cn(
                      "h-11 transition-colors",
                      errors.name && "border-destructive focus-visible:ring-destructive"
                    )}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-lg">!</span>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Property Type */}
                <div className="space-y-3">
                  <Label htmlFor="propertyType" className="font-semibold">
                    Loại bất động sản
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    defaultValue={propertyType}
                    onValueChange={(value) =>
                      setValue("propertyType", value as PropertyType)
                    }
                  >
                    <SelectTrigger
                      id="propertyType"
                      className={cn(
                        "h-11",
                        errors.propertyType && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Chọn loại bất động sản" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PropertyType).map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <span>{PROPERTY_TYPE_LABELS[type]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyType && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-lg">!</span>
                      {errors.propertyType.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="font-semibold">
                    Mô tả (tùy chọn)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về bất động sản của bạn..."
                    disabled={isLoading}
                    rows={4}
                    className="resize-none"
                    {...register("description")}
                  />
                </div>

                {/* Next Button */}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!nameField || !propertyType}
                  className="w-full h-11 gap-2"
                >
                  Tiếp theo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: Location & Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Location Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Địa chỉ
                </CardTitle>
                <CardDescription>
                  Vị trí chi tiết của bất động sản
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Street Address */}
                <div className="space-y-3">
                  <Label htmlFor="address" className="font-semibold">
                    Địa chỉ chi tiết
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="ví dụ: 123 Nguyễn Huệ, Phường 1"
                    disabled={isLoading}
                    className={cn(
                      "h-11 transition-colors",
                      errors.address && "border-destructive"
                    )}
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-lg">!</span>
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* City - Ward Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div className="space-y-3">
                    <Label htmlFor="city" className="font-semibold">
                      Thành phố
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      defaultValue={selectedCity}
                      onValueChange={(value) => {
                        setSelectedCity(value);
                        setValue("city", value);
                        setValue("ward", "");
                        loadWards(value); // Load wards for selected city
                      }}
                    >
                      <SelectTrigger
                        id="city"
                        className={cn(
                          "h-11",
                          errors.city && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Chọn thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {getProvinceNames().map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="text-lg">!</span>
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  {/* Ward */}
                  <div className="space-y-3">
                    <Label htmlFor="ward" className="font-semibold">
                        Phường/Xã
                      <span className="text-destructive">*</span>
                    </Label>
                      <Select
                        defaultValue={defaultValues?.ward || ""}
                        disabled={!selectedCity || loadingWards}
                        onValueChange={(value) =>
                          setValue("ward", value)
                        }
                    >
                      <SelectTrigger
                          id="ward"
                          className={cn(
                            "h-11",
                            errors.ward && "border-destructive"
                          )}
                        >
                          <SelectValue
                            placeholder={
                              loadingWards 
                                ? "Đang tải..."
                                : selectedCity 
                                  ? "Chọn phường/xã" 
                                  : "Chọn thành phố trước"
                            }
                          />
                      </SelectTrigger>
                        <SelectContent>
                          {loadingWards ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
                            </div>
                          ) : (wardOptions || []).length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground">Chưa có dữ liệu phường/xã cho thành phố này</div>
                          ) : (
                            wardOptions.map((ward) => (
                              <SelectItem key={ward} value={ward}>
                                {ward}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                    </Select>
                      {errors.ward && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <span className="text-lg">!</span>
                          {errors.ward.message}
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-11"
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedCity || !ward}
                className="flex-1 h-11 gap-2"
                onClick={async (e) => {
                  const disabled = isLoading || !selectedCity || !ward;
                  console.debug('[PropertyForm] submit button clicked', { disabled, selectedCity, ward, isLoading });
                  // Trigger validation to show errors
                  try {
                    await trigger();
                  } catch {
                    // ignore
                  }

                  if (disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? "Cập nhật bất động sản" : "Tạo bất động sản"}
              </Button>
            </div>

            {/* Debug helper: show why button is disabled */}
            {(isLoading || !selectedCity || !ward) && (
              <p className="text-sm text-muted-foreground mt-2">{isLoading ? 'Đang gửi dữ liệu...' : !selectedCity ? 'Vui lòng chọn thành phố' : !ward ? 'Vui lòng chọn phường/xã' : ''}</p>
            )}
          </motion.div>
        )}
      </form>
    </div>
  );
}
