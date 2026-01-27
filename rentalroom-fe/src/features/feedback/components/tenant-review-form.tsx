"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import api from "@/lib/api/client";

const reviewSchema = z.object({
  contractId: z.string(),
  rating: z.number().min(1).max(5),
  cleanlinessRating: z.number().min(1).max(5),
  locationRating: z.number().min(1).max(5),
  valueRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  reviewImages: z.array(z.string()).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface TenantReviewFormProps {
  contractId: string;
  roomNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TenantReviewForm({
  contractId,
  roomNumber,
  open,
  onOpenChange,
  onSuccess,
}: TenantReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      contractId,
      rating: 0,
      cleanlinessRating: 0,
      locationRating: 0,
      valueRating: 0,
      comment: "",
      reviewImages: [],
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    try {
      setIsSubmitting(true);
      await api.post("/rooms/reviews", data);
      toast.success("Đánh giá của bạn đã được gửi!");
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error ?
        (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ name, label }: { name: keyof ReviewFormData; label: string }) => {
    const value = form.watch(name) as number;

    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => field.onChange(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= value
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá phòng {roomNumber}</DialogTitle>
          <DialogDescription>
            Chia sẻ trải nghiệm của bạn để giúp người khác đưa ra quyết định tốt hơn
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Overall Rating */}
              <StarRating name="rating" label="Đánh giá tổng thể" />

              {/* Cleanliness Rating */}
              <StarRating name="cleanlinessRating" label="Độ sạch sẽ" />

              {/* Location Rating */}
              <StarRating name="locationRating" label="Vị trí" />

              {/* Value Rating */}
              <StarRating name="valueRating" label="Giá trị" />

              {/* Comment */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhận xét (Tùy chọn)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
