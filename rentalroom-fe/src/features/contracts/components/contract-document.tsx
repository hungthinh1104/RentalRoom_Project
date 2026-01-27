import React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { type Contract } from "@/types"; // Use the full Type definition

interface ContractDocumentProps {
    contract: Contract;
}

export const ContractDocument = React.forwardRef<HTMLDivElement, ContractDocumentProps>(
    ({ contract }, ref) => {
        // Helper to format currency
        const formatCurrency = (value: number) =>
            new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

        // Helper to format date
        const formatDate = (dateString?: string | Date) => {
            if (!dateString) return ".../.../....";
            try {
                return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
            } catch {
                return dateString.toString();
            }
        };

        const today = new Date();

        return (
            <div ref={ref} className="p-10 md:p-12 mx-auto w-[210mm] min-w-[210mm] min-h-[297mm] bg-white text-black font-serif text-[12pt] leading-relaxed text-justify print:p-8 print:mx-0 print:w-auto print:min-w-0 print:shadow-none shadow-2xl box-border">
                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="uppercase font-bold text-base tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                    <h4 className="font-bold text-sm border-b-2 border-black inline-block pb-1 mb-4">Độc lập - Tự do - Hạnh phúc</h4>
                    <h1 className="text-2xl font-bold uppercase mt-6 tracking-wide">HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>
                    <p className="italic text-sm mt-2">Mã hợp đồng: <span className="font-bold">{contract.contractNumber || "............"}</span></p>
                </div>

                {/* Date Location */}
                <div className="mb-6 italic text-right px-4">
                    TP.HCM, ngày {format(today, "dd")} tháng {format(today, "MM")} năm {format(today, "yyyy")}
                </div>

                {/* Introduction */}
                <div className="mb-6 pl-4">
                    <p>Hợp đồng này được lập và ký kết giữa các bên dưới đây:</p>
                </div>

                {/* Party A (Landlord) */}
                <div className="mb-8">
                    <h2 className="font-bold text-base mb-3 uppercase border-b border-border inline-block pr-10">BÊN CHO THUÊ (BÊN A):</h2>
                    <table className="w-full text-left border-collapse ml-2">
                        <tbody>
                            <tr>
                                <td className="w-40 font-semibold py-1 align-top italic">Ông/Bà:</td>
                                <td className="uppercase font-bold">{contract.landlord?.user?.fullName || "................................................"}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold py-1 align-top italic">CCCD/CMND:</td>
                                <td>{contract.landlord?.citizenId || "........................"}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold py-1 align-top italic">Điện thoại:</td>
                                <td>{contract.landlord?.user?.phoneNumber || "........................"}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold py-1 align-top italic">Địa chỉ:</td>
                                <td>{contract.landlord?.address || "........................................................................"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Party B (Tenant) */}
                <div className="mb-8">
                    <h2 className="font-bold text-base mb-3 uppercase border-b border-border inline-block pr-10">BÊN THUÊ (BÊN B):</h2>
                    <table className="w-full text-left border-collapse ml-2">
                        <tbody>
                            <tr>
                                <td className="w-40 font-semibold py-1 align-top italic">Ông/Bà:</td>
                                <td className="uppercase font-bold">{contract.tenant?.user?.fullName || "................................................"}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold py-1 align-top italic">CCCD/CMND:</td>
                                <td>{contract.tenant?.citizenId || "........................"}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold py-1 align-top italic">Điện thoại:</td>
                                <td>{contract.tenant?.user?.phoneNumber || "........................"}</td>
                            </tr>
                            <tr>
                                <td className="font-semibold py-1 align-top italic">Email:</td>
                                <td>{contract.tenant?.user?.email || "........................"}</td>
                            </tr>
                            {contract.tenant?.address && (
                                <tr>
                                    <td className="font-semibold py-1 align-top italic">HKTT:</td>
                                    <td>{contract.tenant.address}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Terms */}
                <div className="space-y-6">

                    {/* Article 1 */}
                    <div>
                        <h2 className="font-bold text-base uppercase mb-2">Điều 1: Đối tượng hợp đồng</h2>
                        <div className="pl-6 space-y-1">
                            <p>Bên A đồng ý cho Bên B thuê phòng trọ số <strong className="uppercase">{contract.room?.roomNumber}</strong>.</p>
                            <p>Thuộc bất động sản: <strong>{contract.room?.property?.name}</strong>.</p>
                            <p>Tại địa chỉ: <strong>{contract.room?.property?.address}</strong>.</p>
                            <p>Diện tích sử dụng: {contract.room?.area ? `${contract.room.area} m²` : "..."}.</p>
                            <p>Mục đích thuê: Sử dụng để ở.</p>
                            <p>Số lượng người ở tối đa: {contract.maxOccupants || contract.room?.maxOccupants || "..."} người.</p>
                        </div>
                    </div>

                    {/* Article 2 */}
                    <div>
                        <h2 className="font-bold text-base uppercase mb-2">Điều 2: Thời hạn và Giá trị hợp đồng</h2>
                        <div className="pl-6 space-y-1">
                            <p>2.1. Thời hạn thuê: Từ ngày <strong>{formatDate(contract.startDate)}</strong> đến ngày <strong>{formatDate(contract.endDate)}</strong>.</p>
                            <p>2.2. Giá thuê phòng: <strong>{formatCurrency(contract.monthlyRent)}</strong> / tháng.</p>
                            <p>2.3. Tiền đặt cọc: <strong>{formatCurrency(contract.deposit)}</strong>.</p>
                            <p className="italic text-sm pl-4 mt-1 mb-2 text-muted-foreground font-medium">
                                (Khoản tiền này dùng để đảm bảo thực hiện hợp đồng và sẽ được hoàn trả cho Bên B khi kết thúc hợp đồng, sau khi đã trừ các khoản phí chưa thanh toán hoặc chi phí khắc phục hư hỏng nếu có).
                            </p>
                            <p>2.4. Phương thức thanh toán: Tiền mặt hoặc Chuyển khoản.</p>
                            <p>2.5. Thời hạn thanh toán: Từ ngày 01 đến ngày <strong>{contract.paymentDay || "05"}</strong> hàng tháng.</p>
                        </div>
                    </div>

                    {/* Article 3 */}
                    <div>
                        <h2 className="font-bold text-base uppercase mb-2">Điều 3: Danh sách cư dân (Người ở chung)</h2>
                        <div className="pl-6">
                            {contract.residents && contract.residents.length > 0 ? (
                                <table className="w-full border-collapse border border-border mt-2 text-sm">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="border border-border px-3 py-2 text-left w-10">STT</th>
                                            <th className="border border-border px-3 py-2 text-left">Họ và tên</th>
                                            <th className="border border-border px-3 py-2 text-left">Quan hệ</th>
                                            <th className="border border-border px-3 py-2 text-left">CCCD/SĐT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contract.residents.map((res, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-border px-3 py-2 text-center">{idx + 1}</td>
                                                <td className="border border-border px-3 py-2 font-medium">{res.fullName}</td>
                                                <td className="border border-border px-3 py-2">
                                                    {res.relationship === 'SPOUSE' && 'Vợ/chồng'}
                                                    {res.relationship === 'CHILD' && 'Con'}
                                                    {res.relationship === 'PARENT' && 'Cha/mẹ'}
                                                    {res.relationship === 'FRIEND' && 'Bạn'}
                                                    {res.relationship === 'OTHER' && 'Khác'}
                                                    {!res.relationship && '...'}
                                                </td>
                                                <td className="border border-border px-3 py-2">{res.citizenId || res.phoneNumber || "---"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>Chỉ bao gồm Bên thuê (Ông/Bà được nêu tại Điều 1).</p>
                            )}
                        </div>
                    </div>

                    {/* Article 4 */}
                    <div>
                        <h2 className="font-bold text-base uppercase mb-2">Điều 4: Trang thiết bị bàn giao</h2>
                        <div className="pl-6">
                            {contract.room?.amenities && contract.room.amenities.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {contract.room.amenities.map((item, i) => (
                                        <span key={i} className="inline-block px-3 py-1 bg-muted border border-border rounded text-sm">
                                            ☑ {item}
                                        </span>
                                    ))}
                                    <p className="w-full text-sm italic mt-2 text-muted-foreground"> (Bên B cam kết bảo quản và sử dụng đúng mục đích các trang thiết bị trên).</p>
                                </div>
                            ) : (
                                <p>Phòng trống, không bao gồm nội thất.</p>
                            )}
                        </div>
                    </div>

                    {/* Article 5 */}
                    <div>
                        <h2 className="font-bold text-base uppercase mb-2">Điều 5: Quyền và Nghĩa vụ chung</h2>
                        <div className="pl-6 space-y-2">
                            <p><strong>5.1. Trách nhiệm Bên A:</strong></p>
                            <ul className="list-disc ml-5">
                                <li>Giao phòng đúng thời hạn và đảm bảo công trình an toàn kỹ thuật.</li>
                                <li>Đảm bảo quyền sử dụng riêng biệt cho Bên B.</li>
                                <li>Nhanh chóng sửa chữa các hư hỏng thuộc về kết cấu nhà (tường, mái, hệ thống điện nước âm).</li>
                            </ul>
                            <p><strong>5.2. Trách nhiệm Bên B:</strong></p>
                            <ul className="list-disc ml-5">
                                <li>Thanh toán tiền thuê và hóa đơn dịch vụ đầy đủ, đúng hạn.</li>
                                <li>Giữ gìn vệ sinh chung, tuân thủ quy định về giờ giấc, an ninh trật tự.</li>
                                <li>Bồi thường nếu làm hư hỏng tài sản trang thiết bị do lỗi chủ quan.</li>
                                <li>Không tự ý cải tạo, đục phá hoặc thay đổi kết cấu phòng.</li>
                            </ul>
                        </div>
                    </div>

                    {contract.terms && (
                        <div>
                            <h2 className="font-bold text-base uppercase mb-2">Điều 6: Thỏa thuận khác</h2>
                            <div className="pl-6 whitespace-pre-wrap font-medium bg-muted/50 p-4 rounded border border-border text-sm">
                                {contract.terms}
                            </div>
                        </div>
                    )}

                    {/* Commit */}
                    <div className="mt-8">
                        <h2 className="font-bold text-base uppercase mb-2">Điều {contract.terms ? 7 : 6}: Điều khoản thi hành</h2>
                        <div className="pl-6 space-y-1">
                            <p>Hai bên cam kết thực hiện đúng các điều khoản khoán này.</p>
                            <p>Mọi tranh chấp (nếu có) sẽ được ưu tiên giải quyết qua thương lượng. Trong trường hợp không thể thỏa thuận, tranh chấp sẽ được đưa ra Tòa án có thẩm quyền để giải quyết.</p>
                            <p>Hợp đồng có hiệu lực kể từ ngày ký. Được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-10 mt-16 mb-10 overflow-avoid break-inside-avoid">
                    <div className="text-center">
                        <h3 className="font-bold text-base uppercase">ĐẠI DIỆN BÊN A</h3>
                        <p className="italic text-sm text-muted-foreground"> (Ký, ghi rõ họ tên)</p>
                        <div className="h-40 flex items-center justify-center relative">
                            {/* Visual placeholder for physical signature */}
                            <div className="text-muted/20 font-bold text-6xl opacity-20 rotate-12 select-none">BÊN A</div>
                        </div>
                        <p className="font-bold uppercase text-lg">{contract.landlord?.user?.fullName}</p>
                    </div>
                    <div className="text-center relative">
                        <h3 className="font-bold text-base uppercase">ĐẠI DIỆN BÊN B</h3>
                        <p className="italic text-sm text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-40 flex items-center justify-center relative">
                            {(contract.status === 'ACTIVE' || contract.status === 'DEPOSIT_PENDING') && (
                                <div className="border-4 border-destructive rounded-lg px-4 py-2 text-destructive font-bold uppercase rotate-[-12deg] opacity-80 shadow-sm bg-white/50 backdrop-blur-sm z-10">
                                    <p className="text-xs tracking-widest border-b border-destructive pb-1 mb-1">ĐÃ KÝ ĐIỆN TỬ</p>
                                    <p className="text-lg">{contract.tenant?.user?.fullName}</p>
                                    <p className="text-[10px] mt-1 font-normal overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                                        {format(new Date(), "HH:mm dd/MM/yyyy")}
                                    </p>
                                </div>
                            )}
                        </div>
                        <p className="font-bold uppercase text-lg">{contract.tenant?.user?.fullName}</p>
                    </div>
                </div>
            </div>
        );
    }
);

ContractDocument.displayName = "ContractDocument";
