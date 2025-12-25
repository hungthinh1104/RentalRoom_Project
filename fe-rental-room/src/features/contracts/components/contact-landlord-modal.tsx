import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import { contractsApi } from '@/lib/api/contractsApi';
import { useSession } from '@/features/auth/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ContactLandlordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
  landlordName: string;
}

export function ContactLandlordModal({
  open,
  onOpenChange,
  roomId,
  roomName,
  landlordName,
}: ContactLandlordModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    requestedMoveInDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng đăng nhập để gửi đơn đăng ký.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: 'Cảnh báo',
        description: 'Vui lòng nhập tin nhắn.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await contractsApi.createApplication({
        roomId,
        tenantId: userId,
        message: formData.message,
        requestedMoveInDate: formData.requestedMoveInDate
          ? new Date(formData.requestedMoveInDate).toISOString()
          : undefined,
      });

      toast({
        title: 'Thành công',
        description: `Đơn đăng ký của bạn đã được gửi cho ${landlordName}. Chúng tôi sẽ thông báo cho bạn khi có phản hồi.`,
      });

      // Reset form
      setFormData({ message: '', requestedMoveInDate: '' });
      onOpenChange(false);

      // Optional: Navigate to applications page
      // router.push('/dashboard/tenant/applications');
    } catch (error: any) {
      console.error('Error creating rental application:', error);
      toast({
        title: 'Lỗi',
        description:
          error?.response?.data?.message ||
          'Có lỗi xảy ra. Vui lòng thử lại.',
        variant: 'destructive',
      });
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
            Gửi đơn đăng ký thuê phòng "{roomName}" cho {landlordName}
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
              Tin nhắn <span className="text-red-500">*</span>
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
