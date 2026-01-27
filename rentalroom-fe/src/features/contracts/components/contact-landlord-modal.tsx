import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { contractsApi } from '@/features/contracts/api/contracts-api';
import { useSession } from '@/features/auth/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ContactLandlordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
  landlordId?: string;
  landlordName: string;
}

export function ContactLandlordModal({
  open,
  onOpenChange,
  roomId,
  roomName,
  landlordId,
  landlordName,
}: ContactLandlordModalProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    requestedMoveInDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[ContactLandlordModal] Submit triggered', {
      userId,
      landlordId,
      message: formData.message,
      roomId,
    });

    if (!userId) {
      toast.error('Vui lòng đăng nhập để gửi đơn đăng ký.');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Vui lòng nhập tin nhắn.');
      return;
    }

    console.log('[ContactLandlordModal] Starting API call...');
    setLoading(true);

    try {
      const result = await contractsApi.createApplication({
        roomId,
        tenantId: userId,
        ...(landlordId && { landlordId }), // Only include if exists
        message: formData.message,
        requestedMoveInDate: formData.requestedMoveInDate
          ? new Date(formData.requestedMoveInDate).toISOString()
          : undefined,
      });

      console.log('[ContactLandlordModal] API success:', result);
      toast.success(`Đơn đăng ký của bạn đã được gửi cho ${landlordName}. Chúng tôi sẽ thông báo cho bạn khi có phản hồi.`);

      // Invalidate and refetch applications to show the new one
      await queryClient.invalidateQueries({ queryKey: ['applications'] });

      // Reset form
      setFormData({ message: '', requestedMoveInDate: '' });
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('[ContactLandlordModal] API error:', error);
      let description = 'Có lỗi xảy ra. Vui lòng thử lại.';
      if (error instanceof Error) {
        description = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const eObj = error as Record<string, unknown>;
        const resp = eObj['response'] as Record<string, unknown> | undefined;
        const data = resp?.['data'] as Record<string, unknown> | undefined;
        const maybe = data?.['message'];
        if (typeof maybe === 'string') description = maybe;
      }
      toast.error(description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Liên Hệ Chủ Nhà</DialogTitle>
          <DialogDescription>
            Gửi đơn đăng ký thuê phòng &ldquo;{roomName}&rdquo; cho {landlordName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Move-in Date */}
          <div className="space-y-2">
            <label
              htmlFor="moveInDate"
              className="text-sm font-medium text-foreground"
            >
              Ngày dự kiến nhận phòng (tùy chọn)
            </label>
            <Input
              id="moveInDate"
              type="date"
              value={formData.requestedMoveInDate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requestedMoveInDate: e.target.value,
                })
              }
              disabled={loading}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label
              htmlFor="message"
              className="text-sm font-medium text-foreground"
            >
              Tin nhắn <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="message"
              placeholder="Giới thiệu về bản thân, lý do bạn muốn thuê phòng này..."
              value={formData.message}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  message: e.target.value,
                })
              }
              disabled={loading}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 ký tự
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi Đơn
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
