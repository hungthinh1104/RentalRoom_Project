
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Upload, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { UserDocumentType } from '@/features/documents/api/documents-api';
import { useCreateDocument } from '@/features/documents/hooks/use-documents';

// Schema validation
const formSchema = z.object({
    title: z.string().min(2, {
        message: "Tên tài liệu phải có ít nhất 2 ký tự.",
    }),
    type: z.nativeEnum(UserDocumentType),
    description: z.string().optional(),
    expiryDate: z.date().optional(),
    file: z.any()
        .refine((files) => files?.length == 1, "Vui lòng chọn một file.")
        .refine((files) => files?.[0]?.size <= 5000000, `Kích thước file tối đa là 5MB.`)
        .refine(
            (files) => ['image/jpeg', 'image/png', 'application/pdf'].includes(files?.[0]?.type),
            "Chỉ hỗ trợ định dạng .jpg, .png và .pdf"
        ),
});

interface DocumentUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DocumentUploadModal({ open, onOpenChange }: DocumentUploadModalProps) {
    const { mutate: createDocument, isPending } = useCreateDocument();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            type: UserDocumentType.OTHER,
            description: "",
            // expiryDate is undefined by default
        },
    });

    // Handle file selection manually since standard input type=file is tricky with RHF
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            form.setValue('file', e.target.files);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!selectedFile) return;

        // TODO: Integrate actual file upload to blob storage/S3 here
        // For now, we'll Mock the upload by pretending we have a URL
        // In a real app, you'd verify the upload first, get the URL, then call the API.

        // Simulating file upload...
        // const uploadFormData = new FormData();
        // uploadFormData.append('file', selectedFile);
        // const uploadRes = await uploadApi.upload(uploadFormData);
        const mockFileUrl = `https://example.com/uploads/${selectedFile.name}`;

        createDocument({
            title: values.title,
            type: values.type,
            description: values.description,
            expiryDate: values.expiryDate?.toISOString(),
            fileUrl: mockFileUrl, // Use the real URL here
        }, {
            onSuccess: () => {
                form.reset();
                setSelectedFile(null);
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tải tài liệu mới</DialogTitle>
                    <DialogDescription>
                        Điền thông tin và tải lên tài liệu của bạn. Hỗ trợ PDF, JPG, PNG (max 5MB).
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên tài liệu <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Hợp đồng thuê nhà A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại tài liệu</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn loại tài liệu" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={UserDocumentType.CONTRACT}>Hợp đồng</SelectItem>
                                                <SelectItem value={UserDocumentType.PCCC_CERTIFICATE}>Chứng nhận PCCC</SelectItem>
                                                <SelectItem value={UserDocumentType.DEED}>Sổ đỏ/Giấy tờ nhà</SelectItem>
                                                <SelectItem value={UserDocumentType.BUSINESS_LICENSE}>Giấy phép KD</SelectItem>
                                                <SelectItem value={UserDocumentType.IDENTITY_CARD}>CCCD/CMND</SelectItem>
                                                <SelectItem value={UserDocumentType.INVOICE}>Hóa đơn</SelectItem>
                                                <SelectItem value={UserDocumentType.OTHER}>Khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expiryDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Ngày hết hạn</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "Pd", { locale: vi })
                                                        ) : (
                                                            <span>Chọn ngày</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date()
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả thêm</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ghi chú về tài liệu..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="file"
                            render={() => (
                                <FormItem>
                                    <FormLabel>File đính kèm <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="cursor-pointer"
                                            />
                                            {selectedFile && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        form.resetField('file');
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tải lên
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
