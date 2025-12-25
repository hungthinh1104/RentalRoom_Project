# Kế hoạch: ApplicationsList + Trang Applications (Tenant/Landlord)

## Mục tiêu
- Hiển thị danh sách đơn đăng ký thuê phòng (tenant/landlord) rõ ràng, nhanh, dễ thao tác.
- Hỗ trợ lọc theo trạng thái, phân trang, và xem chi tiết nhanh.
- Hành động đúng quyền: Tenant rút đơn; Landlord duyệt/từ chối.
- UI/UX tiếng Việt, gọn gàng, responsive, dễ bảo trì.

## Phạm vi
- Component: `ApplicationsList` (props: `view: 'tenant'|'landlord'`, `pageSize?: number`).
- Trang:
  - Tenant: `/dashboard/tenant/applications`
  - Landlord: `/dashboard/landlord/applications`
- Trạng thái tải, rỗng, lỗi, thành công với thông báo thân thiện.

## API & Hợp đồng dữ liệu
- Endpoint list: `GET /contracts/applications`
  - Params: `tenantId?`, `landlordId?`, `status?`, `page?`, `limit?`
  - Trả về: `{ data: RentalApplication[], meta: { page, limit, total, totalPages } }`
- Hành động:
  - Tenant rút đơn: `PATCH /contracts/applications/:id/withdraw`
  - Landlord duyệt: `PATCH /contracts/applications/:id/approve`
  - Landlord từ chối: `PATCH /contracts/applications/:id/reject`
- Chi tiết đơn: `GET /contracts/applications/:id`

## Luồng UI/UX
- Header: tiêu đề theo vai trò + bộ lọc trạng thái (Tất cả/Chờ duyệt/Đã duyệt/Bị từ chối/Đã rút).
- Danh sách dạng thẻ hàng (grid 12 cột ở md+): Phòng | Người đăng ký | Ngày đăng ký | Trạng thái | Hành động.
- Hành động theo vai trò:
  - Tenant (PENDING): nút “Rút đơn”; nút “Xem chi tiết”.
  - Landlord (PENDING): nút “Duyệt”, “Từ chối”.
- Trạng thái tải: skeleton 4 hàng.
- Trạng thái rỗng: “Chưa có đơn nào.”
- Phân trang: Trang trước / Trang sau, hiển thị “Trang X / Y”.

## Quy tắc code & kiến trúc
- Sử dụng hooks sẵn có: `useApplications`, `useApproveApplication`, `useRejectApplication`, `useWithdrawApplication`.
- Tách bạch UI/logic: component gọn, callbacks dùng `useCallback`, params dùng `useMemo`.
- Tất cả nhãn/Thông báo bằng tiếng Việt.
- Giữ kiểu chữ, màu theo tokens hiện có (badge status).

## Hiệu năng & khả dụng
- Truy vấn có `queryKey` ổn định để cache chuẩn.
- Paginate phía server; page size mặc định 10 (tùy biến được).
- Điều kiện `enabled` cho query phụ thuộc `userId`.
- Nút disabled trong khi mutation đang chạy; toast kết quả.

## Kiểm thử nhanh
- Tenant có thể thấy đơn của chính mình, rút thành công, danh sách cập nhật.
- Landlord có thể duyệt/từ chối, danh sách cập nhật.
- Lọc trạng thái hoạt động đúng và reset về trang 1 khi đổi filter.
- Pagination chuyển trang đúng, disable ở đầu/cuối.

## Cấu trúc file
- Component: `src/features/contracts/components/applications-list.tsx`
- Tenant page: `src/app/(main)/dashboard/tenant/applications/page.tsx`
- Landlord page: `src/app/(main)/dashboard/landlord/applications/page.tsx`

## TODOs
1. Thêm ô tìm kiếm (phòng/người đăng ký) + debounce.
2. Chọn số dòng/trang (10/20/50) từ Select.
3. Hàng có thể click mở chi tiết (cả hai vai trò).
4. Bộ lọc nâng cao (theo phòng, thời gian).
5. Thêm test e2e nhẹ cho luồng rút/duyệt/từ chối.
