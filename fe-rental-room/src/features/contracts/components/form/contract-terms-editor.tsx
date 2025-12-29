"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { ContractInput } from "../../schemas";

interface ContractTermsEditorProps {
    form: UseFormReturn<ContractInput>;
}

const DEFAULT_TERMS = `Điều khoản chung:
- Bên thuê có trách nhiệm bảo quản tài sản cho thuê như của riêng mình
- Không được phép cho người khác thuê lại hoặc cải tạo không phép
- Tuân thủ nội quy chung cư/dãy trọ
- Nộp các khoản phí dịch vụ công cộng (nước, điện, internet) theo định kỳ
- Cam kết không tổ chức các hoạt động gây ồn ào hay ảnh hưởng đến hàng xóm
- Khi hết hạn hợp đồng, bàn giao nhà trong tình trạng sạch sẽ, nguyên vẹn

Điều khoản chấm dứt:
Bất kỳ bên nào muốn chấm dứt hợp đồng trước thời hạn phải báo trước tối thiểu 30 ngày và tuân theo quy định pháp luật hiện hành.`;

export function ContractTermsEditor({ form }: ContractTermsEditorProps) {
    const terms = form.watch("terms");

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="terms">Nội dung điều khoản</Label>
                <Textarea
                    id="terms"
                    {...form.register("terms")}
                    placeholder={DEFAULT_TERMS}
                    rows={12}
                    className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                    {terms?.length || 0} ký tự
                </p>
            </div>
        </div>
    );
}
