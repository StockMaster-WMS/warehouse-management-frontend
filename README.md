# Warehouse Management — Frontend

**StockMaster** — giao diện web cho hệ thống quản lý kho.

## Giới thiệu dự án

Trong bối cảnh doanh nghiệp cần theo dõi hàng hóa đa kho, luồng nhập–xuất và đối tác (khách hàng, nhà cung cấp), việc ghi chép thủ công hoặc dùng bảng tách rời dễ gây sai lệch số liệu và chậm ra quyết định. Dự án hướng tới một **nền tảng quản lý kho tập trung**: người dùng có thể xem tổng quan tồn kho, thao tác phiếu nhập, đơn đặt hàng, danh mục sản phẩm và báo cáo trên cùng một ứng dụng web hiện đại.

**Phần frontend** (repository này) đóng vai trò **lớp tương tác với người dùng**: trình bày dữ liệu rõ ràng, hỗ trợ thao tác CRUD và luồng nghiệp vụ (nhập hàng, PO, putaway, đơn hàng…), đồng thời **kết nối với backend qua REST API**. State và gọi API được tổ chức bằng Redux Toolkit cùng RTK Query; giao diện xây dựng trên Next.js và TypeScript nhằm dễ bảo trì và mở rộng khi thêm module hoặc quyền truy cập.

Đây là một phần của **đồ án / hệ thống quản lý kho**; phần xử lý nghiệp vụ, dữ liệu và bảo mật phía máy chủ do **backend** đảm nhiệm. Frontend được khởi tạo từ `create-next-app` và phát triển tiếp theo yêu cầu nghiệp vụ kho cụ thể của nhóm.

## Công nghệ

| Lớp | Thư viện |
|-----|----------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, [Base UI](https://base-ui.com/) / shadcn-style components, Lucide icons |
| Form & validation | React Hook Form, Zod |
| State & API | Redux Toolkit, RTK Query (services trong `src/store/services`) |
| HTTP | Axios (instance + interceptor token / 401) |
| Biểu đồ | Recharts |
| File Excel | xlsx (import/export) |
| Kiểm thử | Vitest, Testing Library |

## Chức năng chính (theo menu ứng dụng)

- **Tổng quan kho** — `/dashboard`
- **Theo dõi tồn kho** — `/inventory`
- **Kho** — danh sách, tạo / chỉnh sửa kho
- **Sản phẩm** — danh sách, CRUD, **nhóm / loại hàng** (categories)
- **Đơn hàng & giao nhận** — `/orders`
- **Nhập hàng** — phiếu nhập, đơn nhập (PO), putaway
- **Khách hàng**, **Nhà cung cấp**
- **Nhật ký hoạt động**, **Báo cáo**
- **Cài đặt cá nhân / AI**, **Bảo mật & phân quyền**

`/settings` hiện chỉ giữ các cấu hình đã có hành vi thật: hồ sơ nhanh, giao diện cá nhân, đổi mật khẩu và khóa kết nối AI. Các màn cấu hình workflow / dữ liệu / mặc định nghiệp vụ chưa được đưa vào phạm vi bàn giao khi chưa có persistence và logic backend tương ứng.

Trang gốc `/` là landing page public để công cụ tìm kiếm có nội dung index; các màn vận hành nội bộ vẫn yêu cầu đăng nhập.

## Yêu cầu môi trường

- **Node.js** 20+ (khuyến nghị LTS)
- **npm** (hoặc pnpm / yarn tương đương)

## Cài đặt và chạy

```bash
# Cài dependency
npm install

# Chạy dev (mặc định http://localhost:3000)
npm run dev

# Build production
npm run build

# Chạy bản build
npm start

# Lint
npm run lint
```

## Biến môi trường

Tạo file `.env.local` (hoặc `.env`) ở thư mục gốc project:

| Biến | Mô tả |
|------|--------|
| `NEXT_PUBLIC_API_BASE` **hoặc** `NEXT_PUBLIC_API_BASE_URL` | Gốc API mà Axios dùng. Nếu để URL chỉ có origin (vd. `http://localhost:9000`), code có thể tự chuẩn hóa thêm `/api` tùy cấu hình backend. Nếu không set, mặc định dùng `/api` (phù hợp khi dùng rewrite Next.js tới gateway). |
| `NEXT_PUBLIC_SITE_URL` | URL public sau khi deploy, ví dụ `https://stockmaster.vn`. Biến này được dùng cho canonical URL, Open Graph, `robots.txt` và `sitemap.xml`; cần đặt đúng domain thật trước khi submit Google Search Console. |

Chi tiết logic chuẩn hóa URL nằm trong `src/lib/constants.ts`.

## Cấu trúc thư mục (tóm tắt)

```
src/
  app/                 # App Router: layout, (dashboard)/..., page.tsx
  components/          # UI dùng chung + features (bảng, form PO, dialog, …)
  store/               # Redux store, slices, RTK Query services
  types/               # TypeScript types theo domain
  lib/                 # axios instance, constants, utils Excel / category
  hooks/               # hooks dùng chung
```

## Tích hợp backend

- Mọi request đi qua `src/lib/axios-instance.ts`: gắn `Authorization: Bearer <accessToken>` từ `localStorage` nếu có.
- Phản hồi **401**: xóa token và chuyển hướng tới `/login` (cần route / backend tương ứng khi bật auth đầy đủ).

Đảm bảo API backend chạy và CORS cho phép origin dev (vd. `http://localhost:3000`) nếu gọi trực tiếp cross-origin.

## Kiểm thử

```bash
npm run test
```

(Cấu hình trong `vitest.config.ts`.)
