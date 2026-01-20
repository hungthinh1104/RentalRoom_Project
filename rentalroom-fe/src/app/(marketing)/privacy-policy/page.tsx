import { Metadata } from 'next';
import Script from 'next/script';
import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from 'lucide-react';
import {
    LegalPageLayout,
    LegalSection,
    LegalCard,
    LegalList,
} from '@/components/legal/legal-page-layout';
import {
    generateLegalPageStructuredData,
    generateBreadcrumbStructuredData,
} from '@/lib/seo/legal-structured-data';

const LAST_UPDATED = '2025-01-07';
const VERSION = '1.0';
const PAGE_TITLE = 'Chính sách Bảo mật Dữ liệu';
const PAGE_DESCRIPTION =
    'Chính sách bảo mật dữ liệu cá nhân của Rental Room tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân tại Việt Nam';

export const metadata: Metadata = {
    title: `${PAGE_TITLE} | Rental Room`,
    description: PAGE_DESCRIPTION,
    keywords: [
        'chính sách bảo mật',
        'bảo vệ dữ liệu cá nhân',
        'PDPL',
        'Nghị định 13/2023',
        'quyền riêng tư',
        'rental room',
    ],
    openGraph: {
        title: `${PAGE_TITLE} | Rental Room`,
        description: PAGE_DESCRIPTION,
        type: 'website',
        locale: 'vi_VN',
    },
    alternates: {
        canonical: '/privacy-policy',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function PrivacyPolicyPage() {
    const structuredData = generateLegalPageStructuredData({
        title: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        datePublished: '2025-01-07',
        dateModified: LAST_UPDATED,
        author: {
            name: 'Rental Room',
            url: process.env.NEXT_PUBLIC_SITE_URL,
        },
        publisher: {
            name: 'Rental Room',
        },
    });

    const breadcrumbData = generateBreadcrumbStructuredData(PAGE_TITLE);

    return (
        <>
            {/* Structured Data for SEO */}
            <Script
                id="privacy-policy-structured-data"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <Script
                id="privacy-policy-breadcrumb"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />

            <LegalPageLayout
                title={PAGE_TITLE}
                lastUpdated={LAST_UPDATED}
                version={VERSION}
                description="Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân"
                legalBasis={[
                    'Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân',
                    'Luật An ninh mạng 2018',
                    'Luật Giao dịch điện tử 2023',
                ]}
            >
                {/* Commitment Card */}
                <LegalCard title="Cam kết của chúng tôi" icon={Shield}>
                    <p>
                        Rental Room cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. Chính sách
                        này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của
                        bạn theo quy định pháp luật Việt Nam.
                    </p>
                </LegalCard>

                {/* Section 1: Data Collection */}
                <LegalSection title="1. Dữ liệu chúng tôi thu thập" icon={Database}>
                    <LegalCard>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">1.1. Thông tin cá nhân cơ bản</h3>
                                <LegalList items={['Họ và tên', 'Địa chỉ email', 'Số điện thoại', 'Vai trò (Người thuê / Chủ nhà / Quản trị viên)']} />
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">1.2. Thông tin định danh (tùy chọn)</h3>
                                <LegalList items={['Số CMND/CCCD (khi ký hợp đồng)', 'Ngày sinh', 'Địa chỉ thường trú']} />
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">1.3. Thông tin tài chính</h3>
                                <LegalList items={['Lịch sử thanh toán', 'Hóa đơn điện nước', 'Thông tin ngân hàng (chỉ số tài khoản, không lưu mật khẩu)']} />
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">1.4. Dữ liệu hành vi và sở thích</h3>
                                <LegalList
                                    items={[
                                        'Lịch sử tìm kiếm phòng',
                                        'Phòng yêu thích',
                                        'Sở thích về vị trí, giá cả',
                                        'Dữ liệu AI (vector embeddings để gợi ý phòng)',
                                    ]}
                                />
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">1.5. Dữ liệu kỹ thuật</h3>
                                <LegalList
                                    items={[
                                        'Địa chỉ IP',
                                        'Loại trình duyệt và thiết bị',
                                        'Thời gian truy cập',
                                        'Cookie và công nghệ tương tự',
                                    ]}
                                />
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">1.6. Dữ liệu vị trí (chỉ cấp thành phố)</h3>
                                <p className="text-muted-foreground">
                                    Khi bạn ký hợp đồng điện tử, chúng tôi lưu <strong>vị trí cấp thành phố</strong>{' '}
                                    (ví dụ: &quot;TP. Hồ Chí Minh&quot;) cho mục đích kiểm toán pháp lý.{' '}
                                    <strong className="text-foreground">
                                        Chúng tôi KHÔNG thu thập tọa độ GPS chính xác
                                    </strong>{' '}
                                    của bạn.
                                </p>
                            </div>
                        </div>
                    </LegalCard>
                </LegalSection>

                {/* Section 2: Purpose */}
                <LegalSection title="2. Mục đích sử dụng dữ liệu" icon={Eye}>
                    <LegalCard>
                        <p>
                            <strong>2.1. Cung cấp dịch vụ:</strong> Quản lý hợp đồng thuê phòng, xử lý thanh
                            toán, hỗ trợ khách hàng
                        </p>
                        <p>
                            <strong>2.2. Cá nhân hóa trải nghiệm:</strong> Gợi ý phòng phù hợp dựa trên AI và
                            sở thích của bạn (chỉ khi bạn đồng ý)
                        </p>
                        <p>
                            <strong>2.3. Bảo mật và phòng chống gian lận:</strong> Xác thực danh tính, phát
                            hiện hoạt động bất thường
                        </p>
                        <p>
                            <strong>2.4. Cải thiện dịch vụ:</strong> Phân tích dữ liệu để nâng cao chất lượng
                        </p>
                        <p>
                            <strong>2.5. Tuân thủ pháp luật:</strong> Lưu trữ hồ sơ theo quy định kế toán và
                            thuế
                        </p>
                    </LegalCard>
                </LegalSection>

                {/* Section 3: User Rights */}
                <LegalSection title="3. Quyền của bạn (theo Nghị định 13/2023/NĐ-CP)" icon={UserCheck}>
                    <LegalCard>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">3.1. Quyền truy cập dữ liệu</h3>
                                <p className="text-muted-foreground">
                                    Bạn có quyền yêu cầu xem toàn bộ dữ liệu cá nhân mà chúng tôi lưu trữ về bạn.
                                    <br />
                                    Truy cập: <strong>Cài đặt → Quyền riêng tư → Xuất dữ liệu</strong>
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">3.2. Quyền xóa dữ liệu</h3>
                                <p className="text-muted-foreground">
                                    Bạn có thể yêu cầu xóa tài khoản và dữ liệu cá nhân. Lưu ý: Dữ liệu liên quan
                                    đến hợp đồng đang hoạt động sẽ được lưu trữ theo quy định pháp luật.
                                    <br />
                                    Truy cập: <strong>Cài đặt → Tài khoản → Xóa tài khoản</strong>
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">3.3. Quyền rút consent</h3>
                                <p className="text-muted-foreground">
                                    Bạn có thể rút lại sự đồng ý cho các mục đích cụ thể (ví dụ: tắt AI gợi ý).
                                    <br />
                                    Truy cập: <strong>Cài đặt → Quyền riêng tư</strong>
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">3.4. Quyền yêu cầu sửa đổi</h3>
                                <p className="text-muted-foreground">
                                    Bạn có thể cập nhật hoặc sửa đổi thông tin cá nhân bất kỳ lúc nào.
                                    <br />
                                    Truy cập: <strong>Hồ sơ → Chỉnh sửa</strong>
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">3.5. Quyền khiếu nại</h3>
                                <p className="text-muted-foreground">
                                    Nếu bạn cho rằng quyền riêng tư của bạn bị vi phạm, vui lòng liên hệ:
                                    <br />
                                    Email: <strong>privacy@rentalroom.vn</strong>
                                    <br />
                                    Hoặc khiếu nại lên cơ quan chức năng theo Nghị định 13/2023/NĐ-CP
                                </p>
                            </div>
                        </div>
                    </LegalCard>
                </LegalSection>

                {/* Section 4: Security */}
                <LegalSection title="4. Bảo mật dữ liệu" icon={Lock}>
                    <LegalCard>
                        <p>
                            <strong>4.1. Mã hóa:</strong> Tất cả dữ liệu được mã hóa khi truyền tải (HTTPS/TLS)
                        </p>
                        <p>
                            <strong>4.2. Mật khẩu:</strong> Mật khẩu được băm bằng bcrypt, không lưu trữ dạng
                            plain text
                        </p>
                        <p>
                            <strong>4.3. Phân quyền:</strong> Hệ thống RBAC (Role-Based Access Control) đảm bảo
                            chỉ người có quyền mới truy cập được dữ liệu
                        </p>
                        <p>
                            <strong>4.4. Audit logs:</strong> Mọi thao tác quan trọng đều được ghi log để kiểm
                            tra
                        </p>
                        <p>
                            <strong>4.5. Backup:</strong> Dữ liệu được sao lưu định kỳ để phòng mất mát
                        </p>
                    </LegalCard>
                </LegalSection>

                {/* Section 5: Third-party Sharing */}
                <LegalSection title="5. Chia sẻ dữ liệu với bên thứ ba">
                    <LegalCard>
                        <p>
                            <strong>5.1. Chúng tôi KHÔNG bán dữ liệu của bạn</strong>
                        </p>
                        <p>
                            <strong>5.2. Chia sẻ với đối tác thanh toán:</strong> SePay (để xử lý giao dịch)
                        </p>
                        <p>
                            <strong>5.3. Chia sẻ với dịch vụ lưu trữ:</strong> ImageKit (để lưu trữ hình ảnh)
                        </p>
                        <p>
                            <strong>5.4. Cung cấp cho cơ quan nhà nước:</strong> Khi có yêu cầu hợp pháp từ cơ
                            quan có thẩm quyền
                        </p>
                    </LegalCard>
                </LegalSection>

                {/* Section 6: Retention */}
                <LegalSection title="6. Lưu trữ và xóa dữ liệu">
                    <LegalCard>
                        <p>
                            <strong>6.1. Thời gian lưu trữ:</strong>
                        </p>
                        <LegalList
                            items={[
                                'Dữ liệu tài khoản: Trong thời gian sử dụng dịch vụ',
                                'Dữ liệu hợp đồng: 5 năm sau khi kết thúc (theo quy định kế toán)',
                                'Dữ liệu thanh toán: 10 năm (theo quy định thuế)',
                                'Dữ liệu AI: Xóa ngay khi bạn tắt tính năng AI',
                            ]}
                        />
                        <p className="mt-3">
                            <strong>6.2. Xóa dữ liệu:</strong> Sau khi hết thời gian lưu trữ, dữ liệu sẽ được
                            xóa hoặc ẩn danh hóa
                        </p>
                    </LegalCard>
                </LegalSection>

                {/* Section 7: Cookies */}
                <LegalSection title="7. Cookie và công nghệ theo dõi" icon={AlertTriangle}>
                    <LegalCard>
                        <p>Chúng tôi sử dụng cookie để:</p>
                        <LegalList
                            items={[
                                'Duy trì phiên đăng nhập (session cookie)',
                                'Ghi nhớ sở thích của bạn',
                                'Phân tích lưu lượng truy cập',
                            ]}
                        />
                        <p className="mt-3">
                            Bạn có thể tắt cookie trong cài đặt trình duyệt, nhưng một số tính năng có thể
                            không hoạt động. Xem chi tiết tại{' '}
                            <a href="/cookie-policy" className="text-primary underline">
                                Chính sách Cookie
                            </a>
                            .
                        </p>
                    </LegalCard>
                </LegalSection>

                {/* Section 8: Children */}
                <LegalSection title="8. Trẻ em">
                    <LegalCard>
                        <p>
                            Dịch vụ của chúng tôi không dành cho người dưới 18 tuổi. Nếu bạn dưới 18 tuổi, vui
                            lòng sử dụng dịch vụ dưới sự giám sát của phụ huynh.
                        </p>
                    </LegalCard>
                </LegalSection>

                {/* Section 9: Changes */}
                <LegalSection title="9. Thay đổi chính sách">
                    <LegalCard>
                        <p>
                            Chúng tôi có thể cập nhật chính sách này theo thời gian. Mọi thay đổi quan trọng sẽ
                            được thông báo qua email hoặc thông báo trên hệ thống. Phiên bản hiện tại:{' '}
                            <strong>{VERSION}</strong>
                        </p>
                    </LegalCard>
                </LegalSection>

                {/* Section 10: Contact */}
                <LegalSection title="10. Liên hệ">
                    <LegalCard>
                        <p>Nếu bạn có câu hỏi về chính sách này, vui lòng liên hệ:</p>
                        <p>
                            <strong>Email:</strong> privacy@rentalroom.vn
                        </p>
                        <p>
                            <strong>Điện thoại:</strong> [Số điện thoại]
                        </p>
                        <p>
                            <strong>Địa chỉ:</strong> [Địa chỉ văn phòng]
                        </p>
                    </LegalCard>
                </LegalSection>
            </LegalPageLayout>
        </>
    );
}
