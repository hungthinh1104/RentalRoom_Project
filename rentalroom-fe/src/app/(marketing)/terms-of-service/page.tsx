import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Scale, AlertTriangle, Shield, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
    title: 'Điều khoản Sử dụng | Rental Room',
    description: 'Điều khoản và điều kiện sử dụng dịch vụ Rental Room',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-soft" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[120px] -z-10" />

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <div className="container max-w-5xl mx-auto h-16 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span className="text-primary">Rental</span>Room
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="container max-w-4xl mx-auto py-12 px-4 space-y-12">
                {/* Hero Section */}
                <div className="space-y-6 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        Điều khoản Sử dụng
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span className="px-3 py-1 rounded-full bg-secondary/50 border border-border/50">
                            Phiên bản 1.0
                        </span>
                        <span>•</span>
                        <span>Cập nhật lần cuối: 07/01/2025</span>
                    </div>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
                        Chào mừng bạn đến với Rental Room. Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng nền tảng của chúng tôi.
                    </p>
                </div>

                {/* Acceptance Card */}
                <div className="glass-card p-6 md:p-8 rounded-[24px] border-primary/20 bg-primary/5 shadow-lg shadow-primary/5">
                    <div className="flex items-start gap-4">
                        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Chấp nhận điều khoản</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Bằng việc đăng ký và sử dụng Rental Room, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
                                Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ ngay lập tức.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-12">
                    {/* Section 1 */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-base">1</span>
                            Định nghĩa
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { title: "Dịch vụ", desc: "Nền tảng quản lý cho thuê phòng trọ Rental Room và các tính năng liên quan." },
                                { title: "Người dùng", desc: "Bao gồm Người thuê (Tenant), Chủ nhà (Landlord), và Quản trị viên (Admin)." },
                                { title: "Nội dung", desc: "Thông tin, hình ảnh, văn bản do người dùng tải lên hệ thống." },
                                { title: "Hợp đồng điện tử", desc: "Hợp đồng thuê phòng được tạo, ký và lưu trữ trên nền tảng." }
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Separator className="bg-border/50" />

                    {/* Section 2 */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-base">2</span>
                            Đăng ký và Tài khoản
                        </h2>
                        <div className="glass-card p-6 md:p-8 rounded-[24px] space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">2.1. Điều kiện đăng ký</h3>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Phải từ 18 tuổi trở lên
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Cung cấp thông tin chính xác và đầy đủ
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Chịu trách nhiệm bảo mật mật khẩu
                                    </li>
                                </ul>
                            </div>
                            <Separator className="bg-border/50" />
                            <div>
                                <h3 className="text-lg font-semibold mb-3">2.2. Trách nhiệm & Quyền hạn</h3>
                                <p className="text-muted-foreground mb-4">
                                    Bạn chịu trách nhiệm hoàn toàn cho mọi hoạt động diễn ra dưới tài khoản của mình.
                                    Chúng tôi có quyền tạm khóa hoặc xóa tài khoản nếu phát hiện vi phạm hoặc gian lận.
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator className="bg-border/50" />

                    {/* Section 3 */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <Scale className="w-6 h-6 text-primary" />
                            3. Quyền và Nghĩa vụ
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-6 space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center">
                                        <div className="font-bold text-xl">T</div>
                                    </div>
                                    <h3 className="text-xl font-bold">Người thuê (Tenant)</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                            Tìm kiếm, xem phòng và gửi yêu cầu thuê
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                            Ký hợp đồng điện tử và thanh toán online
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                            Yêu cầu bảo trì và hỗ trợ kỹ thuật
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-6 space-y-4">
                                    <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                                        <div className="font-bold text-xl">L</div>
                                    </div>
                                    <h3 className="text-xl font-bold">Chủ nhà (Landlord)</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                            Đăng tin, quản lý phòng và duyệt yêu cầu
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                            Tạo hợp đồng, thu tiền và quản lý cư dân
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                            Đảm bảo chất lượng cơ sở vật chất
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <Separator className="bg-border/50" />

                    {/* Section 4 */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <Shield className="w-6 h-6 text-primary" />
                            4. Pháp lý & Bảo mật
                        </h2>
                        <div className="glass-card p-6 md:p-8 rounded-[24px] space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Hợp đồng điện tử
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Hợp đồng ký kết trên Rental Room tuân thủ Luật Giao dịch điện tử 2023.
                                        IP, thời gian và chữ ký số được lưu trữ an toàn để đảm bảo tính pháp lý.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary" />
                                        Quyền sở hữu trí tuệ
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Nội dung người dùng tải lên thuộc quyền sở hữu của họ. Tuy nhiên, chúng tôi
                                        có quyền sử dụng để cung cấp và cải thiện dịch vụ.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <Separator className="bg-border/50" />

                    {/* Section 5 */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                            5. Giới hạn Trách nhiệm
                        </h2>
                        <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-6">
                            <p className="text-muted-foreground leading-relaxed">
                                Rental Room là nền tảng công nghệ trung gian. Chúng tôi <strong>không</strong> sở hữu, bán,
                                hoặc cho thuê bất động sản. Chúng tôi không chịu trách nhiệm cho các tranh chấp phát sinh
                                trực tiếp từ hợp đồng thuê giữa Chủ nhà và Người thuê, trừ các lỗi kỹ thuật thuộc về hệ thống.
                            </p>
                        </div>
                    </section>

                    {/* Footer Contact */}
                    <div className="mt-12 p-8 rounded-3xl bg-secondary/30 text-center space-y-4">
                        <h3 className="text-xl font-bold text-foreground">Bạn vẫn còn thắc mắc?</h3>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            Đừng ngần ngại liên hệ với đội ngũ pháp lý của chúng tôi để được giải đáp chi tiết.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
                            <a href="mailto:legal@rentalroom.vn" className="flex items-center gap-2 text-primary font-medium hover:underline">
                                <Mail className="w-4 h-4" /> legal@rentalroom.vn
                            </a>
                            <a href="#" className="flex items-center gap-2 text-primary font-medium hover:underline">
                                <Phone className="w-4 h-4" /> 1900 1234
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-8 bg-background/50 backdrop-blur-md mt-20">
                <div className="container max-w-5xl mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; 2026 Rental Room. All rights reserved. | <a href="/privacy" className="hover:text-foreground transition-colors">Chính sách bảo mật</a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
