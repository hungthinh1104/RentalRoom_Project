"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface TerminateDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (data: { reason: string; noticeDays: number }) => void;
  loading?: boolean;
  deposit?: number;
  daysRemaining?: number;
  isTenant?: boolean;
}

export function TerminateDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  deposit = 0,
  daysRemaining = 0,
  isTenant = true,
}: TerminateDialogProps) {
  const [reason, setReason] = useState('');
  const [noticeDays, setNoticeDays] = useState(30);

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do chấm dứt hợp đồng');
      return;
    }
    onConfirm({ reason: reason.trim(), noticeDays });
    setReason('');
    setNoticeDays(30);
  };

  // Calculate penalty
  let penaltyAmount = 0;
  let penaltyWarning = '';

  if (daysRemaining > 0) {
    if (isTenant) {
      penaltyAmount = deposit;
      penaltyWarning = `⚠️ Chấm dứt trước hạn (còn ${daysRemaining} ngày): BẠN SẼ MẤT 100% TIỀN CỌC (${penaltyAmount.toLocaleString('vi-VN')} VNĐ). Mặc dù báo trước ${noticeDays} ngày, do vi phạm cam kết thời gian thuê, tiền cọc sẽ bị giữ lại.`;
    } else {
      penaltyAmount = deposit * 2;
      penaltyWarning = `⚠️ Chấm dứt trước hạn (còn ${daysRemaining} ngày): BẠN PHẢI TRẢ LẠI 100% TIỀN CỌC + ĐỀN BÙ THÊM 100% TIỀN CỌC = ${penaltyAmount.toLocaleString('vi-VN')} VNĐ cho người thuê.`;
      if (noticeDays < 30) {
        penaltyWarning += ` Bạn chỉ báo trước ${noticeDays} ngày (yêu cầu tối thiểu 30 ngày).`;
      }
    }
  } else {
    penaltyWarning = '✅ Hợp đồng đã hết hạn hoặc sắp hết hạn. Không có phạt.';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">⚠️ Chấm dứt hợp đồng</DialogTitle>
          <DialogDescription>
            Vui lòng đọc kỹ cảnh báo bên dưới trước khi xác nhận chấm dứt hợp đồng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Warning Alert */}
          <Alert variant={daysRemaining > 0 ? "destructive" : "default"} className="border-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-sm font-medium whitespace-pre-line">
              {penaltyWarning}
            </AlertDescription>
          </Alert>

          {/* Contract Terms Reminder */}
          {daysRemaining > 0 && (
            <div className="bg-warning-light/20 border-2 border-warning/30 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm text-warning-foreground">📋 Điều khoản hợp đồng:</h3>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li>• <strong>Điều 6.2:</strong> Bên {isTenant ? 'B (Người thuê)' : 'A (Chủ nhà)'} chấm dứt trước thời hạn đã ký sẽ {isTenant ? 'BỊ MẤT 100% TIỀN CỌC' : 'PHẢI ĐỀN BÙ 200% TIỀN CỌC'}.</li>
                <li>• Kể cả trường hợp đã báo trước 30 ngày, do vi phạm cam kết thời gian thuê, {isTenant ? 'tiền cọc sẽ bị giữ lại' : 'vẫn phải bồi thường'}.</li>
                <li>• Muốn tránh mất cọc, {isTenant ? 'người thuê' : 'chủ nhà'} cần tìm người thay thế thuê tiếp (được bên còn lại chấp thuận).</li>
              </ul>
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="noticeDays" className="text-sm font-medium">
                Số ngày báo trước <span className="text-destructive">*</span>
              </Label>
              <Input
                id="noticeDays"
                type="number"
                min={0}
                value={noticeDays}
                onChange={(e) => setNoticeDays(Number(e.target.value))}
                placeholder="Số ngày đã báo trước"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Yêu cầu tối thiểu: 30 ngày
              </p>
            </div>

            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Lý do chấm dứt <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Chuyển công tác, phòng không phù hợp..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-muted/50 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" required />
              <span className="text-xs">
                Tôi xác nhận đã đọc và hiểu rõ các điều khoản chấm dứt hợp đồng. Tôi chấp nhận {isTenant ? 'mất tiền cọc' : 'bồi thường theo quy định'} khi chấm dứt trước thời hạn.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận chấm dứt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
