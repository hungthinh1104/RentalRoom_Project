'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DocumentList } from '@/features/documents/components/document-list';
import { UserDocument } from '@/features/documents/api/documents-api';
import { DocumentUploadModal } from '@/features/documents/components/document-upload-modal';
import { useDocuments } from '@/features/documents/hooks/use-documents';

export default function DocumentsPage() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // TODO: Add filters for type and property
    const { data: documents, isLoading } = useDocuments();

    const filteredDocuments = documents?.filter((doc: UserDocument) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý tài liệu</h1>
                    <p className="text-muted-foreground mt-1">
                        Lưu trữ và quản lý các tài liệu pháp lý, hợp đồng, và giấy tờ liên quan.
                    </p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Tải tài liệu lại
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách tài liệu</CardTitle>
                    <CardDescription>
                        {documents?.length || 0} tài liệu được lưu trữ trong hệ thống
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm tài liệu..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Add more filters here later */}
                    </div>

                    <DocumentList
                        documents={filteredDocuments || []}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <DocumentUploadModal
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
            />
        </div>
    );
}
