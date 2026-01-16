"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateMaintenance } from '../hooks/use-maintenance';
import type { MaintenanceCategory, MaintenancePriority } from '../types';
import type { Contract } from '@/types';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-auth';
import { useContracts } from '@/features/contracts/hooks/use-contracts';

interface Props {
  roomId?: string; // Optional - if creating from a room page
  onSuccess?: () => void;
}

const categories: MaintenanceCategory[] = ['PLUMBING', 'ELECTRICAL', 'APPLIANCE', 'OTHER'];
const priorities: MaintenancePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const categoryLabels: Record<MaintenanceCategory, string> = {
  PLUMBING: 'Ống nước',
  ELECTRICAL: 'Điện',
  APPLIANCE: 'Thiết bị',
  OTHER: 'Khác',
};

const priorityLabels: Record<MaintenancePriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: '🔴 Khẩn cấp',
};

export function NewTenantMaintenanceForm({ roomId, onSuccess }: Props) {
  const mutation = useCreateMaintenance();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const contractsQuery = useContracts(userId ? { tenantId: userId, status: 'ACTIVE' } : undefined);

  const roomOptions: { id: string; label: string }[] = (contractsQuery.data?.data || [])
    .filter((c: Contract) => c.room?.id)
    .map((c: Contract) => ({
      id: c.room!.id,
      label: `${c.room?.property?.name ?? 'Bất động sản'} — Phòng ${c.room?.roomNumber ?? c.roomId}`,
    }));

  const [form, setForm] = useState({
    roomId: roomId || (roomOptions[0]?.id || ''),
    title: '',
    description: '',
    category: 'OTHER' as MaintenanceCategory,
    priority: 'MEDIUM' as MaintenancePriority,
    requestDate: '',
    cost: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.roomId) e.roomId = 'Vui lòng chọn phòng (hoặc mở trang phòng để tạo)';
    if (!form.title.trim()) e.title = 'Tiêu đề là bắt buộc';
    if (!form.description.trim()) e.description = 'Mô tả là bắt buộc';
    if (!form.category) e.category = 'Chọn loại sự cố';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!userId) {
      toast.error('Vui lòng đăng nhập để gửi yêu cầu.');
      return;
    }

    try {
      await mutation.mutateAsync({
        roomId: form.roomId,
        tenantId: userId,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        requestDate: form.requestDate ? new Date(form.requestDate).toISOString() : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
      });

      toast.success('Yêu cầu bảo trì đã được gửi. Chúng tôi sẽ cập nhật tiến độ.');
      setForm({ roomId: roomId ?? '', title: '', description: '', category: 'OTHER', priority: 'MEDIUM', requestDate: '', cost: '' });
      setErrors({});
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="roomId">Phòng (chọn phòng bạn đang thuê)</Label>
        {roomOptions.length > 0 ? (
          <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })}>
            <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {roomOptions.map((opt: { id: string; label: string }) => (
                <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Input
              id="roomId"
              placeholder="Không tìm thấy hợp đồng. Nhập ID phòng (nếu biết)"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              aria-invalid={!!errors.roomId}
            />
            <p className="text-sm text-muted-foreground mt-1">Không tìm thấy hợp đồng đang hoạt động của bạn. Nếu bạn đang ở trong phòng, hãy nhập ID phòng hoặc mở trang phòng và dùng nút &apos;Liên hệ&apos; để gửi yêu cầu.</p>
          </>
        )}
        {errors.roomId && <p className="text-destructive text-sm mt-1">{errors.roomId}</p>}
      </div>

      <div>
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          placeholder="Ví dụ: Vòi nước rỉ"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          placeholder="Mô tả vấn đề chi tiết..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={6}
        />
        {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Loại</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as MaintenanceCategory })}>
            <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Độ ưu tiên</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as MaintenancePriority })}>
            <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {priorities.map((p) => (
                <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="requestDate">Ngày yêu cầu (tùy chọn)</Label>
          <Input id="requestDate" type="date" value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="cost">Ước tính chi phí (VND, tùy chọn)</Label>
          <Input id="cost" type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isLoading} className="w-40">
          {mutation.isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>
      </div>
    </form>
  );
}