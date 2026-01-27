import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Cookie, Settings, Eye, Shield } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Chính sách Cookie | Rental Room',
    description: 'Thông tin về cách Rental Room sử dụng cookie và công nghệ theo dõi',
};

export default function CookiePolicyPage() {
    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Chính sách Cookie</h1>
                <p className="text-muted-foreground">
                    Cập nhật lần cuối: 07/01/2025 | Phiên bản: 1.0
                </p>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cookie className="h-5 w-5" />
                        Cookie là gì?
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập
                        website. Cookie giúp website ghi nhớ thông tin về lần truy cập của bạn, làm cho
                        trải nghiệm sử dụng thuận tiện hơn.
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-8">
                {/* Section 1 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">1. Cookie chúng tôi sử dụng</h2>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    1.1. Cookie cần thiết (Bắt buộc)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-muted-foreground">
                                    Những cookie này cần thiết để website hoạt động và không thể tắt.
                                </p>

                                <div className="border-l-4 border-primary pl-4">
                                    <p className="font-semibold">Session Cookie (next-auth.session-token)</p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Mục đích:</strong> Duy trì phiên đăng nhập của bạn
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Thời gian:</strong> Xóa khi đóng trình duyệt
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Loại:</strong> HttpOnly, Secure, SameSite=Lax
                                    </p>
                                </div>

                                <div className="border-l-4 border-primary pl-4">
                                    <p className="font-semibold">CSRF Token</p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Mục đích:</strong> Bảo vệ khỏi tấn công CSRF
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Thời gian:</strong> Xóa khi đóng trình duyệt
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    1.2. Cookie chức năng (Tùy chọn)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-muted-foreground">
                                    Cookie này giúp cải thiện trải nghiệm của bạn bằng cách ghi nhớ sở thích.
                                </p>

                                <div className="border-l-4 border-info pl-4">
                                    <p className="font-semibold">Language Preference</p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Mục đích:</strong> Ghi nhớ ngôn ngữ bạn chọn
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Thời gian:</strong> 1 năm
                                    </p>
                                </div>

                                <div className="border-l-4 border-info pl-4">
                                    <p className="font-semibold">Theme Preference</p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Mục đích:</strong> Ghi nhớ chế độ sáng/tối
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Thời gian:</strong> 1 năm
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Eye className="h-5 w-5" />
                                    1.3. Cookie phân tích (Tùy chọn)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-muted-foreground">
                                    Cookie này giúp chúng tôi hiểu cách người dùng sử dụng website để cải thiện dịch vụ.
                                </p>

                                <div className="border-l-4 border-warning pl-4">
                                    <p className="font-semibold">Analytics Cookie</p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Mục đích:</strong> Theo dõi lượt truy cập, trang được xem nhiều nhất
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Thời gian:</strong> 2 năm
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Lưu ý:</strong> Dữ liệu được ẩn danh hóa
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Section 2 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Cookie của bên thứ ba</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>2.1. SePay (Thanh toán):</strong></p>
                            <p className="text-muted-foreground">
                                Khi bạn thanh toán qua SePay, họ có thể đặt cookie để xử lý giao dịch.
                                Vui lòng xem chính sách cookie của SePay tại website của họ.
                            </p>

                            <p><strong>2.2. ImageKit (Lưu trữ hình ảnh):</strong></p>
                            <p className="text-muted-foreground">
                                Hình ảnh được tải từ ImageKit CDN có thể sử dụng cookie để tối ưu hóa tốc độ.
                            </p>

                            <p className="text-sm text-muted-foreground mt-4">
                                <strong>Lưu ý:</strong> Chúng tôi không kiểm soát cookie của bên thứ ba.
                                Vui lòng xem chính sách riêng tư của họ để biết thêm chi tiết.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 3 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">3. Quản lý Cookie</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">3.1. Tắt cookie qua trình duyệt</h3>
                                <p className="text-muted-foreground mb-2">
                                    Bạn có thể tắt cookie trong cài đặt trình duyệt:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                    <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                                    <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                                    <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                                    <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">3.2. Hậu quả khi tắt cookie</h3>
                                <p className="text-muted-foreground">
                                    Nếu bạn tắt cookie cần thiết, một số tính năng sẽ không hoạt động:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                    <li>Không thể đăng nhập</li>
                                    <li>Không thể lưu sở thích</li>
                                    <li>Trải nghiệm sử dụng kém hơn</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">3.3. Xóa cookie hiện có</h3>
                                <p className="text-muted-foreground">
                                    Bạn có thể xóa cookie đã lưu bất cứ lúc nào trong cài đặt trình duyệt.
                                    Lưu ý: Bạn sẽ bị đăng xuất và mất các cài đặt đã lưu.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 4 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">4. Do Not Track (DNT)</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="mb-3">
                                Một số trình duyệt có tính năng &quot;Do Not Track&quot; (DNT) để yêu cầu website
                                không theo dõi bạn.
                            </p>
                            <p className="text-muted-foreground">
                                Hiện tại, Rental Room <strong>tôn trọng DNT</strong> và sẽ không sử dụng
                                cookie phân tích nếu bạn bật tính năng này.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 5 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Cập nhật Chính sách</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p>
                                Chúng tôi có thể cập nhật chính sách cookie này khi thêm tính năng mới.
                                Thay đổi quan trọng sẽ được thông báo trên website.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 6 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">6. Liên hệ</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <p>Nếu bạn có câu hỏi về cookie, vui lòng liên hệ:</p>
                            <p><strong>Email:</strong> privacy@rentalroom.vn</p>
                            <p><strong>Điện thoại:</strong> [Số điện thoại]</p>
                        </CardContent>
                    </Card>
                </section>
            </div>

            <Separator className="my-8" />

            <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Tóm tắt</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Chúng tôi sử dụng cookie để duy trì phiên đăng nhập và cải thiện trải nghiệm</li>
                    <li>Cookie cần thiết không thể tắt, cookie khác là tùy chọn</li>
                    <li>Bạn có thể quản lý cookie trong cài đặt trình duyệt</li>
                    <li>Chúng tôi tôn trọng Do Not Track (DNT)</li>
                </ul>
            </div>
        </div>
    );
}
