const ExcelJS = require('exceljs');

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Rental Room Team';
workbook.lastModifiedBy = 'Rental Room Team';
workbook.created = new Date();
workbook.modified = new Date();

// ==========================================
// SHEET 1: DOCUMENT CONTROL
// ==========================================
const sheet1 = workbook.addWorksheet('Document Control');

// Define Columns
sheet1.columns = [
    { header: 'Section', key: 'section', width: 20 },
    { header: 'Item', key: 'item', width: 20 },
    { header: 'Value', key: 'value', width: 50 },
    { header: 'Comments', key: 'comments', width: 30 },
];

sheet1.addRows([
    ['Header', 'Project Name', 'Rental Room Management System', ''],
    ['Header', 'Document ID', 'TEST-PLAN-001', ''],
    ['Header', 'Version', '1.0', ''],
    ['Header', 'Status', 'Draft', ''],
    ['', '', '', ''],
    ['Revision History', 'v1.0', 'Initial Creation', '2025-12-31'],
    ['', '', '', ''],
    ['References', 'SRS', 'Software Requirements Specification v2.0', ''],
    ['References', 'Design', 'Figma UI/UX Mockups', ''],
    ['', '', '', ''],
    ['Approvals', 'QA Lead', '[Name]', 'Pending'],
    ['Approvals', 'Project Manager', '[Name]', 'Pending'],
]);

// Styling for Document Control
sheet1.getRow(1).font = { bold: true };


// ==========================================
// SHEET 2: TEST PROCEDURES
// ==========================================
const sheet2 = workbook.addWorksheet('Test Procedures');

// Columns
sheet2.columns = [
    { header: 'Test Case ID', key: 'tc_id', width: 15 },
    { header: 'User Story ID', key: 'us_id', width: 12 },
    { header: 'Description', key: 'desc', width: 50 },
    { header: 'Pre-condition', key: 'pre', width: 30 },
    { header: 'Test Steps', key: 'steps', width: 40 },
    { header: 'Expected Result', key: 'expected', width: 40 },
    { header: 'Status', key: 'status', width: 10 },
];

// Test Data
const testCases = [
    // AUTH
    { id: 'TC_AUTH_01', us: 'US01', desc: 'Đăng ký thành công với thông tin hợp lệ (Tenant/Landlord)', pre: 'Chưa đăng nhập', steps: '1. Nhập email chưa tồn tại\n2. Nhập password đúng format\n3. Click Đăng ký', expected: 'Tạo tài khoản thành công, redirect về Login' },
    { id: 'TC_AUTH_02', us: 'US01', desc: 'Đăng ký thất bại do email đã tồn tại', pre: 'Chưa đăng nhập, Email đã có trong DB', steps: '1. Nhập email đã tồn tại\n2. Click Đăng ký', expected: 'Hiển thị lỗi "Email đã được sử dụng"' },
    { id: 'TC_AUTH_03', us: 'US01', desc: 'Đăng ký thất bại do mật khẩu không khớp', pre: 'Chưa đăng nhập', steps: '1. Nhập password và confirm password khác nhau', expected: 'Hiển thị lỗi "Mật khẩu nhập lại không khớp"' },
    { id: 'TC_AUTH_04', us: 'US02', desc: 'Đăng nhập thành công', pre: 'Tài khoản đã Active', steps: '1. Nhập email/pass đúng\n2. Click Login', expected: 'Login thành công, chuyển hướng vào Dashboard theo role' },
    { id: 'TC_AUTH_05', us: 'US02', desc: 'Đăng nhập thất bại do sai Username/Password', pre: 'Tài khoản tồn tại', steps: '1. Nhập sai pass\n2. Click Login', expected: 'Hiển thị lỗi "Thông tin đăng nhập không đúng"' },
    { id: 'TC_AUTH_06', us: 'US03', desc: 'Gửi yêu cầu Reset Password', pre: 'Quên mật khẩu', steps: '1. Vào trang Forgot Password\n2. Nhập email\n3. Click Gửi', expected: 'Gửi email chứa link reset password' },
    { id: 'TC_AUTH_07', us: 'US04', desc: 'Đổi mật khẩu thành công', pre: 'Đã đăng nhập', steps: '1. Vào Profile -> Change Password\n2. Nhập pass cũ đúng, pass mới\n3. Save', expected: 'Cập nhật password mới thành công' },
    { id: 'TC_AUTH_08', us: 'US04', desc: 'Đổi mật khẩu thất bại (Sai pass cũ)', pre: 'Đã đăng nhập', steps: '1. Nhập sai pass cũ\n2. Save', expected: 'Báo lỗi "Mật khẩu hiện tại không đúng"' },
    { id: 'TC_AUTH_09', us: 'US05', desc: 'Cập nhật Profile thành công', pre: 'Đã đăng nhập', steps: '1. Sửa tên, SĐT\n2. Save', expected: 'Lưu thông tin mới vào DB' },
    { id: 'TC_AUTH_10', us: 'US05', desc: 'Upload Avatar', pre: 'Đã đăng nhập', steps: '1. Chọn file ảnh < 5MB\n2. Upload', expected: 'Avatar thay đổi thành công' },

    // PROPERTY
    { id: 'TC_PROP_01', us: 'US06', desc: 'Tạo Property thành công', pre: 'Login as Landlord', steps: '1. Nhập tên, địa chỉ, loại nhà\n2. Save', expected: 'Tạo mới Property thành công' },
    { id: 'TC_PROP_02', us: 'US06', desc: 'Tạo Property thất bại (thiếu info)', pre: 'Login as Landlord', steps: '1. Bỏ trống tên Tòa nhà\n2. Save', expected: 'Báo lỗi các trường bắt buộc' },
    { id: 'TC_PROP_03', us: 'US07', desc: 'Sửa thông tin Property', pre: 'Có Property', steps: '1. Sửa địa chỉ\n2. Save', expected: 'Cập nhật địa chỉ mới' },
    { id: 'TC_PROP_04', us: 'US07', desc: 'Reset/Xóa Property (Soft delete)', pre: 'Có Property', steps: '1. Click Xóa -> Confirm', expected: 'Property bị ẩn khỏi list, không xóa vĩnh viễn' },

    // ROOM
    { id: 'TC_ROOM_01', us: 'US08', desc: 'Thêm Room mới thành công', pre: 'Có Property', steps: '1. Nhập số phòng, giá, diện tích\n2. Save', expected: 'Room được tạo với Status: Available' },
    { id: 'TC_ROOM_02', us: 'US09', desc: 'Thêm tiện ích cho phòng', pre: 'Có Room', steps: '1. Check vào Wifi, AC\n2. Save', expected: 'Danh sách tiện ích được lưu' },
    { id: 'TC_ROOM_03', us: 'US10', desc: 'Upload ảnh phòng', pre: 'Có Room', steps: '1. Chọn 3 ảnh\n2. Upload', expected: 'Ảnh hiển thị trong gallery của phòng' },
    { id: 'TC_ROOM_04', us: 'US10', desc: 'Xóa ảnh phòng', pre: 'Có ảnh', steps: '1. Click icon xóa trên ảnh', expected: 'Ảnh bị xóa khỏi gallery' },
    { id: 'TC_ROOM_05', us: 'US11', desc: 'Đổi trạng thái phòng', pre: 'Có Room', steps: '1. Chuyển sang Maintenance', expected: 'Room status update thành Maintenance' },

    // RENTAL / BOOKING
    { id: 'TC_RENT_01', us: 'US12', desc: 'Tìm kiếm phòng theo Quận', pre: 'Login as Tenant', steps: '1. Chọn TPHCM, Quận 1\n2. Search', expected: 'List ra các phòng ở Quận 1' },
    { id: 'TC_RENT_02', us: 'US12', desc: 'Lọc phòng theo giá', pre: 'Login as Tenant', steps: '1. Nhập min=2tr, max=5tr\n2. Filter', expected: 'Chỉ hiện phòng trong khoảng giá' },
    { id: 'TC_RENT_03', us: 'US13', desc: 'Xem chi tiết phòng', pre: 'List kết quả', steps: '1. Click vào 1 phòng', expected: 'Mở trang Detail với đầy đủ info' },
    { id: 'TC_RENT_04', us: 'US14', desc: 'Thêm phòng yêu thích', pre: 'Login as Tenant', steps: '1. Click icon Tim', expected: 'Icon chuyển đỏ, thêm vào Wishlist' },
    { id: 'TC_RENT_05', us: 'US14', desc: 'Xóa phòng yêu thích', pre: 'Trong Wishlist', steps: '1. Click icon Tim lần nữa', expected: 'Xóa khỏi Wishlist' },
    { id: 'TC_RENT_06', us: 'US15', desc: 'Gửi yêu cầu thuê (Booking)', pre: 'Login as Tenant', steps: '1. Chọn ngày move-in\n2. Click Book', expected: 'Tạo Application status PENDING' },
    { id: 'TC_RENT_07', us: 'US16', desc: 'Landlord nhận thông báo Booking', pre: 'Tenant đã Book', steps: '1. Landlord check Noti', expected: 'Thấy thông báo có khách đặt phòng' },
    { id: 'TC_RENT_08', us: 'US17', desc: 'Approve Booking', pre: 'Booking PENDING', steps: '1. Landlord click Approve', expected: 'Application -> APPROVED, Room -> RESERVED' },
    { id: 'TC_RENT_09', us: 'US17', desc: 'Reject Booking', pre: 'Booking PENDING', steps: '1. Landlord click Reject + Reason', expected: 'Application -> REJECTED' },

    // CONTRACT
    { id: 'TC_CONT_01', us: 'US18', desc: 'Auto Generate Contract', pre: 'Booking Approved', steps: '1. System check event', expected: 'Hợp đồng nháp được tạo tự động' },
    { id: 'TC_CONT_02', us: 'US19', desc: 'Tenant xem hợp đồng', pre: 'Contract Draft', steps: '1. Tenant mở Contract', expected: 'Thấy đúng giá tiền và điều khoản' },
    { id: 'TC_CONT_03', us: 'US20', desc: 'Tenant ký hợp đồng', pre: 'Contract Draft', steps: '1. Tenant ký digital\n2. Submit', expected: 'Trạng thái -> PENDING_LANDLORD_SIGN' },
    { id: 'TC_CONT_04', us: 'US21', desc: 'Landlord ký hợp đồng', pre: 'Tenant đã ký', steps: '1. Landlord ký digital\n2. Submit', expected: 'Trạng thái -> ACTIVE' },
    { id: 'TC_CONT_05', us: 'US22', desc: 'Download PDF Contract', pre: 'Contract Active', steps: '1. Click Export PDF', expected: 'Tải xuống file .pdf chuẩn' },
    { id: 'TC_CONT_06', us: 'US23', desc: 'Gia hạn hợp đồng', pre: 'Sắp hết hạn', steps: '1. Click Gia hạn\n2. Chọn ngày mới', expected: 'Update End Date mới' },
    { id: 'TC_CONT_07', us: 'US24', desc: 'Chấm dứt hợp đồng sớm', pre: 'Contract Active', steps: '1. Landlord Terminate', expected: 'Contract -> TERMINATED, tính phạt nếu có' },

    // BILLING
    { id: 'TC_BILL_01', us: 'US25', desc: 'Nhập chỉ số điện nước', pre: 'Cuối tháng', steps: '1. Landlord nhập số cũ/mới', expected: 'Lưu chỉ số tiêu thụ' },
    { id: 'TC_BILL_02', us: 'US26', desc: 'Auto Create Invoice (Cron)', pre: 'Đến ngày chốt', steps: '1. Job chạy', expected: 'Hóa đơn tháng mới được tạo PENDING' },
    { id: 'TC_BILL_03', us: 'US27', desc: 'Tenant nhận thông báo Invoice', pre: 'Invoice Created', steps: '1. Check email', expected: 'Email báo tiền nhà được gửi' },
    { id: 'TC_BILL_04', us: 'US28', desc: 'Thanh toán thành công', pre: 'Invoice Pending', steps: '1. Chọn Banking/QR\n2. Pay', expected: 'Invoice -> PAID' },
    { id: 'TC_BILL_05', us: 'US28', desc: 'Thanh toán thất bại', pre: 'Invoice Pending', steps: '1. Cancel payment gateway', expected: 'Invoice vẫn PENDING' },
    { id: 'TC_BILL_06', us: 'US29', desc: 'Xem lịch sử giao dịch', pre: 'Login', steps: '1. Vào menu Payment History', expected: 'Thấy list các gd cũ' },
    { id: 'TC_BILL_07', us: 'US30', desc: 'Gửi nhắc nợ (Overdue)', pre: 'Quá due date', steps: '1. Cron job check', expected: 'Gửi mail nhắc đóng tiền' },

    // MAINTENANCE
    { id: 'TC_MAIN_01', us: 'US31', desc: 'Gửi Request Bảo trì', pre: 'Login Tenant', steps: '1. Nhập nội dung hỏng hóc\n2. Send', expected: 'Request created (PENDING)' },
    { id: 'TC_MAIN_02', us: 'US32', desc: 'Xử lý Bảo trì', pre: 'Login Landlord', steps: '1. Đánh dấu Complete', expected: 'Status -> COMPLETED' },
    { id: 'TC_MAIN_03', us: 'US33', desc: 'Cấu hình giá dịch vụ', pre: 'Login Landlord', steps: '1. Đổi giá điện 3.5k -> 4k', expected: 'Giá mới áp dụng cho kỳ tới' },

    // REVIEW & SYSTEM
    { id: 'TC_REVW_01', us: 'US34', desc: 'Viết Review', pre: 'Contract Ended', steps: '1. Rate 5 sao + Comment', expected: 'Review được đăng' },
    { id: 'TC_REVW_02', us: 'US35', desc: 'Reply Review', pre: 'Có review', steps: '1. Landlord reply', expected: 'Reply hiển thị dưới review' },
    { id: 'TC_REVW_03', us: 'US36', desc: 'Tính Rating', pre: 'Review posted', steps: '1. Check Property Info', expected: 'Điểm rating trung bình thay đổi' },
    { id: 'TC_SYS_01', us: 'US37', desc: 'Đọc thông báo', pre: 'Có unread noti', steps: '1. Click thông báo', expected: 'Đánh dấu đã đọc' },
    { id: 'TC_SYS_02', us: 'US37', desc: 'Xóa thông báo', pre: 'List Noti', steps: '1. Click Xóa', expected: 'Thông báo biến mất' }
];

testCases.forEach(tc => {
    sheet2.addRow([
        tc.id,
        tc.us,
        tc.desc,
        tc.pre,
        tc.steps,
        tc.expected,
        'Not Run'
    ]);
});

// Styling Sheet 2
sheet2.getRow(1).font = { bold: true };
testCases.forEach((_, index) => {
    const row = sheet2.getRow(index + 2);
    row.getCell(5).alignment = { wrapText: true }; // Wrap steps
});


// WRITE FILE
const fileName = '../../Master_Test_Plan_v1.0.xlsx';
workbook.xlsx.writeFile(fileName)
    .then(() => {
        console.log(`File created successfully at: ${fileName}`);
    })
    .catch((err) => {
        console.error('Error writing file:', err);
    });
