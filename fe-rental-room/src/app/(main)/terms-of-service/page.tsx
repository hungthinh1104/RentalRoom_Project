import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Scale, AlertTriangle, Shield } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Điều khoản Sử dụng | Rental Room',
    description: 'Điều khoản và điều kiện sử dụng dịch vụ Rental Room',
};

export default function TermsOfServicePage() {
    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Điều khoản Sử dụng</h1>
                <p className="text-muted-foreground">
                    Cập nhật lần cuối: 07/01/2025 | Phiên bản: 1.0
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ
                </p>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Chấp nhận điều khoản
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>
                        Bằng việc đăng ký và sử dụng Rental Room, bạn đồng ý tuân thủ các điều khoản
                        và điều kiện được nêu trong tài liệu này. Nếu bạn không đồng ý với bất kỳ
                        điều khoản nào, vui lòng không sử dụng dịch vụ.
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-8">
                {/* Section 1 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">1. Định nghĩa</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>1.1. Dịch vụ:</strong> Nền tảng quản lý cho thuê phòng trọ Rental Room</p>
                            <p><strong>1.2. Người dùng:</strong> Bao gồm Người thuê (Tenant), Chủ nhà (Landlord), và Quản trị viên (Admin)</p>
                            <p><strong>1.3. Nội dung:</strong> Thông tin, hình ảnh, văn bản do người dùng tải lên</p>
                            <p><strong>1.4. Hợp đồng điện tử:</strong> Hợp đồng thuê phòng được tạo và ký trên nền tảng</p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 2 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Đăng ký và Tài khoản</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>2.1. Điều kiện đăng ký:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Phải từ 18 tuổi trở lên</li>
                                <li>Cung cấp thông tin chính xác và đầy đủ</li>
                                <li>Chịu trách nhiệm bảo mật mật khẩu</li>
                            </ul>

                            <p><strong>2.2. Trách nhiệm người dùng:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Không chia sẻ tài khoản cho người khác</li>
                                <li>Thông báo ngay nếu phát hiện truy cập trái phép</li>
                                <li>Cập nhật thông tin khi có thay đổi</li>
                            </ul>

                            <p><strong>2.3. Quyền của chúng tôi:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Từ chối hoặc hủy đăng ký nếu phát hiện gian lận</li>
                                <li>Tạm khóa tài khoản vi phạm điều khoản</li>
                                <li>Xóa tài khoản không hoạt động quá 2 năm (sau thông báo)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 3 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Scale className="h-6 w-6" />
                        3. Quyền và Nghĩa vụ theo Vai trò
                    </h2>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">3.1. Người thuê (Tenant)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p><strong>Quyền:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                    <li>Tìm kiếm và xem thông tin phòng</li>
                                    <li>Gửi đơn thuê phòng</li>
                                    <li>Ký hợp đồng điện tử</li>
                                    <li>Thanh toán trực tuyến</li>
                                    <li>Yêu cầu bảo trì</li>
                                </ul>

                                <p><strong>Nghĩa vụ:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                    <li>Cung cấp thông tin chính xác khi đăng ký</li>
                                    <li>Thanh toán đúng hạn theo hợp đồng</li>
                                    <li>Giữ gìn tài sản thuê</li>
                                    <li>Tuân thủ nội quy của chủ nhà</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">3.2. Chủ nhà (Landlord)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p><strong>Quyền:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                    <li>Đăng tin cho thuê phòng</li>
                                    <li>Duyệt/từ chối đơn thuê</li>
                                    <li>Tạo hợp đồng điện tử</li>
                                    <li>Nhận thanh toán qua nền tảng</li>
                                    <li>Chấm dứt hợp đồng theo quy định</li>
                                </ul>

                                <p><strong>Nghĩa vụ:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                    <li>Cung cấp thông tin phòng chính xác</li>
                                    <li>Đảm bảo phòng đúng mô tả</li>
                                    <li>Bảo trì phòng khi có yêu cầu hợp lý</li>
                                    <li>Tuân thủ pháp luật về cho thuê nhà</li>
                                    <li>Kê khai thuế theo quy định</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Section 4 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">4. Hợp đồng Điện tử</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>4.1. Giá trị pháp lý:</strong></p>
                            <p className="text-muted-foreground">
                                Hợp đồng điện tử được tạo trên nền tảng có giá trị pháp lý theo
                                Luật Giao dịch điện tử 2023 và Bộ luật Dân sự 2015.
                            </p>

                            <p><strong>4.2. Quy trình ký:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Chủ nhà tạo hợp đồng từ đơn thuê được duyệt</li>
                                <li>Cả hai bên xem xét và ký điện tử</li>
                                <li>Hệ thống lưu lại IP, thời gian, vị trí ký</li>
                                <li>Hợp đồng được khóa sau khi cả hai bên ký</li>
                            </ul>

                            <p><strong>4.3. Sửa đổi hợp đồng:</strong></p>
                            <p className="text-muted-foreground">
                                Hợp đồng đã ký <strong>không thể sửa đổi</strong>. Nếu cần thay đổi,
                                phải tạo phiên bản mới và ký lại.
                            </p>

                            <p><strong>4.4. Chấm dứt hợp đồng:</strong></p>
                            <p className="text-muted-foreground">
                                Tuân theo điều khoản trong hợp đồng và Luật Nhà ở 2014. Bên chấm dứt
                                đơn phương phải báo trước theo thỏa thuận.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 5 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Thanh toán và Phí dịch vụ</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>5.1. Phương thức thanh toán:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Chuyển khoản ngân hàng</li>
                                <li>Ví điện tử (MoMo, ZaloPay)</li>
                                <li>Tiền mặt (ghi nhận thủ công)</li>
                            </ul>

                            <p><strong>5.2. Phí dịch vụ:</strong></p>
                            <p className="text-muted-foreground">
                                Hiện tại, Rental Room <strong>MIỄN PHÍ</strong> cho tất cả người dùng.
                                Chúng tôi có thể áp dụng phí trong tương lai và sẽ thông báo trước ít nhất 30 ngày.
                            </p>

                            <p><strong>5.3. Hoàn tiền:</strong></p>
                            <p className="text-muted-foreground">
                                Tiền đặt cọc được hoàn trả theo điều khoản hợp đồng. Rental Room không
                                chịu trách nhiệm về tranh chấp tiền cọc giữa hai bên.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 6 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-6 w-6" />
                        6. Quyền Sở hữu Trí tuệ
                    </h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>6.1. Nội dung của Rental Room:</strong></p>
                            <p className="text-muted-foreground">
                                Tất cả nội dung, thiết kế, logo, mã nguồn thuộc quyền sở hữu của Rental Room.
                                Nghiêm cấm sao chép, sửa đổi, hoặc sử dụng cho mục đích thương mại.
                            </p>

                            <p><strong>6.2. Nội dung của người dùng:</strong></p>
                            <p className="text-muted-foreground">
                                Bạn giữ quyền sở hữu nội dung mình tải lên. Tuy nhiên, bạn cấp cho Rental Room
                                quyền sử dụng nội dung đó để cung cấp dịch vụ.
                            </p>

                            <p><strong>6.3. Nội dung vi phạm:</strong></p>
                            <p className="text-muted-foreground">
                                Chúng tôi có quyền xóa nội dung vi phạm pháp luật, đạo đức, hoặc quyền của người khác.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 7 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        7. Giới hạn Trách nhiệm
                    </h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>7.1. Vai trò của Rental Room:</strong></p>
                            <p className="text-muted-foreground">
                                Rental Room là <strong>nền tảng kết nối</strong> giữa chủ nhà và người thuê.
                                Chúng tôi KHÔNG phải là bên cho thuê, KHÔNG sở hữu phòng, và KHÔNG đại diện cho bất kỳ bên nào.
                            </p>

                            <p><strong>7.2. Không đảm bảo:</strong></p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Tính chính xác của thông tin do người dùng cung cấp</li>
                                <li>Chất lượng phòng đúng như mô tả</li>
                                <li>Hành vi của người dùng khác</li>
                                <li>Dịch vụ luôn khả dụng 100%</li>
                            </ul>

                            <p><strong>7.3. Giới hạn bồi thường:</strong></p>
                            <p className="text-muted-foreground">
                                Rental Room không chịu trách nhiệm cho:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Tranh chấp giữa chủ nhà và người thuê</li>
                                <li>Thiệt hại gián tiếp, ngẫu nhiên, hoặc do hậu quả</li>
                                <li>Mất mát dữ liệu do lỗi kỹ thuật</li>
                                <li>Hành vi gian lận của người dùng</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 8 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">8. Hành vi Cấm</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="mb-3">Người dùng KHÔNG được:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                                <li>Cung cấp thông tin sai lệch, gian lận</li>
                                <li>Mạo danh người khác</li>
                                <li>Spam, quấy rối người dùng khác</li>
                                <li>Tải lên nội dung vi phạm pháp luật, khiêu dâm, bạo lực</li>
                                <li>Hack, phá hoại hệ thống</li>
                                <li>Sử dụng bot, script tự động</li>
                                <li>Thu thập dữ liệu người dùng khác</li>
                                <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 9 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">9. Giải quyết Tranh chấp</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <p><strong>9.1. Thương lượng:</strong></p>
                            <p className="text-muted-foreground">
                                Các bên ưu tiên giải quyết tranh chấp thông qua thương lượng trực tiếp.
                            </p>

                            <p><strong>9.2. Hỗ trợ từ Rental Room:</strong></p>
                            <p className="text-muted-foreground">
                                Chúng tôi có thể hỗ trợ làm trung gian, cung cấp thông tin hợp đồng, lịch sử giao dịch.
                                Tuy nhiên, quyết định cuối cùng thuộc về hai bên hoặc cơ quan có thẩm quyền.
                            </p>

                            <p><strong>9.3. Luật áp dụng:</strong></p>
                            <p className="text-muted-foreground">
                                Điều khoản này tuân theo pháp luật <strong>Việt Nam</strong>.
                                Tranh chấp không giải quyết được sẽ đưa ra Tòa án có thẩm quyền tại Việt Nam.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 10 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">10. Thay đổi Điều khoản</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="mb-3">
                                Chúng tôi có quyền cập nhật điều khoản này. Thay đổi quan trọng sẽ được thông báo
                                qua email hoặc thông báo trên hệ thống ít nhất <strong>15 ngày</strong> trước khi có hiệu lực.
                            </p>
                            <p className="text-muted-foreground">
                                Việc bạn tiếp tục sử dụng dịch vụ sau khi điều khoản mới có hiệu lực
                                đồng nghĩa với việc bạn chấp nhận các thay đổi.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 11 */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4">11. Liên hệ</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <p>Nếu bạn có câu hỏi về điều khoản này, vui lòng liên hệ:</p>
                            <p><strong>Email:</strong> legal@rentalroom.vn</p>
                            <p><strong>Điện thoại:</strong> [Số điện thoại]</p>
                            <p><strong>Địa chỉ:</strong> [Địa chỉ văn phòng]</p>
                        </CardContent>
                    </Card>
                </section>
            </div>

            <Separator className="my-8" />

            <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                    <strong>Tài liệu tham khảo:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Bộ luật Dân sự 2015</li>
                    <li>Luật Nhà ở 2014</li>
                    <li>Luật Giao dịch điện tử 2023</li>
                    <li>Luật Bảo vệ quyền lợi người tiêu dùng 2023</li>
                </ul>
            </div>
        </div>
    );
}
