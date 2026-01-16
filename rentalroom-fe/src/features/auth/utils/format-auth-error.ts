export function formatAuthError(err: unknown): string {
  if (!err) return "Đã có lỗi xảy ra. Vui lòng thử lại.";

  let msg = "";

  if (typeof err === "string") {
    msg = err;
  } else if (err instanceof Error) {
    msg = err.message || String(err);
  } else if (typeof err === "object" && err !== null && "message" in err) {
    const e = err as { message?: unknown };
    msg = typeof e.message === "string" ? e.message : String(e.message ?? String(err));
  } else {
    msg = String(err);
  }

  const m = msg.toLowerCase();

  if (/invalid credentials|credentials signin|credentials sign in|invalid.*credential/i.test(msg)) {
    return "Thông tin đăng nhập không chính xác.";
  }
  if (/email.*already|email.*exists|email.*taken/i.test(msg)) {
    return "Email đã tồn tại.";
  }
  if (/phone.*exists|phone.*already|số điện thoại.*tồn tại/i.test(m)) {
    return "Số điện thoại đã tồn tại.";
  }
  if (/network error/i.test(msg)) {
    return "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.";
  }
  if (/timeout|timed out/i.test(msg)) {
    return "Yêu cầu quá thời gian. Vui lòng thử lại.";
  }
  if (/401|unauthoriz/i.test(m)) {
    return "Không được phép. Vui lòng đăng nhập lại.";
  }
  if (/403/i.test(msg)) return "Truy cập bị từ chối.";
  if (/404/i.test(msg)) return "Không tìm thấy tài nguyên.";
  if (/500|internal server error/i.test(msg)) return "Lỗi máy chủ. Vui lòng thử lại sau.";
  if (/password.*not match|mismatch|must match|mật khẩu không khớp/i.test(msg)) return "Mật khẩu không khớp.";
  if (/verification|verify|mã xác thực/i.test(msg)) return "Xác thực thất bại. Mã không đúng hoặc đã hết hạn.";
  if (/invalid.*email|email.*invalid/i.test(msg)) return "Email không hợp lệ.";

  // If message looks like a path/technical, fallback to a user-friendly generic message in VN
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
