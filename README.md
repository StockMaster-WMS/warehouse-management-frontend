# StockMaster Frontend

Frontend cho StockMaster, hệ thống quản lý kho dùng để theo dõi sản phẩm, tồn kho, nhập hàng, xuất hàng, kiểm kê, báo cáo, phân quyền và trợ lý AI. Ứng dụng được xây dựng bằng Next.js App Router, React, TypeScript và Tailwind CSS, kết nối với backend Spring Boot thông qua REST API.

Repository này tập trung vào trải nghiệm người dùng cho các nghiệp vụ kho: dashboard quản trị, bảng dữ liệu, form nhập liệu, import/export Excel, biểu đồ báo cáo, phân quyền giao diện và luồng đăng nhập an toàn bằng JWT.

## Vai trò của tôi

- Thiết kế và xây dựng giao diện web cho hệ thống quản lý kho StockMaster.
- Phát triển các màn hình nghiệp vụ: dashboard, sản phẩm, kho, vị trí, tồn kho, nhập hàng, xuất hàng, kiểm kê, báo cáo, phân quyền và trợ lý AI.
- Tích hợp REST API với Axios/RTK Query, xử lý access token, refresh token và tự động retry request khi token hết hạn.
- Xây dựng form validation, bảng dữ liệu, bộ lọc, phân trang, trạng thái loading/empty/error và responsive layout.
- Tích hợp import/export Excel, biểu đồ báo cáo, thông báo, theme setting và kiểm soát quyền truy cập theo vai trò.
- Viết test cho logic phân quyền và các phần dùng chung có ảnh hưởng đến trải nghiệm người dùng.

## Điểm nổi bật

- Next.js 16 App Router, React 19 và TypeScript.
- Giao diện quản trị đầy đủ cho các luồng warehouse management thực tế.
- Authentication flow với access token, HttpOnly refresh cookie và tự động refresh khi gặp `401`.
- Role-based UI: ẩn/hiện chức năng theo quyền người dùng.
- Dashboard, báo cáo và biểu đồ bằng Recharts.
- Import/export Excel cho sản phẩm, tồn kho và nghiệp vụ kho.
- Form validation bằng React Hook Form và Zod.
- State management bằng Redux Toolkit và RTK Query.
- Component UI có thể tái sử dụng: table, dialog, sidebar, badge, pagination, searchable select, scanner.
- Hỗ trợ deploy lên Cloudflare Workers thông qua OpenNext.

## Kiến trúc tổng quan

```text
Next.js App Router
      |
      | Axios / RTK Query
      v
Spring Boot REST API
      |
      | JWT access token + refresh cookie
      v
PostgreSQL backend
```

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Redux Toolkit, RTK Query
- Axios
- React Hook Form, Zod
- Recharts
- xlsx
- Vitest, Testing Library
- OpenNext / Cloudflare Workers

## Tài khoản demo

| Vai trò | Tài khoản | Mật khẩu |
| --- | --- | --- |
| Admin | `admin` | `AdmIn@12345` |

> Tài khoản trên dùng cho môi trường demo/local. Không dùng mật khẩu này cho môi trường production.

## Chức năng chính

- Dashboard tổng quan
- Quản lý sản phẩm và danh mục
- Quản lý nhà cung cấp và khách hàng
- Quản lý kho và vị trí lưu trữ
- Theo dõi tồn kho, cảnh báo tồn thấp và gần hết hạn
- Nhập hàng: purchase order, phiếu nhập, putaway
- Xuất hàng: sales order, picking
- Kiểm kê kho
- Hoàn trả hàng
- Báo cáo và xuất Excel
- Nhật ký hoạt động, thông báo
- Quản lý người dùng, vai trò và phân quyền
- Hồ sơ cá nhân, đổi mật khẩu, cài đặt giao diện
- Trợ lý AI và cấu hình AI

## Route chính

- `/` - trang public
- `/login` - đăng nhập
- `/dashboard` - tổng quan
- `/products` - sản phẩm
- `/categories` - danh mục
- `/warehouses` - kho
- `/locations` - vị trí
- `/inventory` - tồn kho
- `/purchase-orders` - đơn nhập
- `/inbound` - phiếu nhập
- `/putaway` - putaway
- `/orders` - đơn xuất
- `/picking` - picking
- `/cycle-counts` - kiểm kê
- `/returns` - hoàn trả
- `/customers` - khách hàng
- `/suppliers` - nhà cung cấp
- `/reports` - báo cáo
- `/history` - nhật ký
- `/notifications` - thông báo
- `/security` - phân quyền
- `/settings` - cài đặt
- `/profile` - hồ sơ cá nhân
- `/ai-assistant` - trợ lý AI

## Yêu cầu môi trường

- Node.js `>=20.9.0`
- npm
- Backend đang chạy, mặc định tại `http://localhost:9000`

## Cài đặt

```bash
npm install
```

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## Biến môi trường

| Biến | Mô tả |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL backend, ví dụ `http://localhost:9000` |
| `NEXT_PUBLIC_API_BASE` | URL backend tương thích với một số service cũ |
| `NEXT_PUBLIC_SITE_URL` | URL public của frontend, dùng cho SEO, sitemap và Open Graph |

Ví dụ chạy local:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:9000
NEXT_PUBLIC_API_BASE=http://localhost:9000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Chạy dự án

Chạy môi trường dev:

```bash
npm run dev
```

Ứng dụng mặc định chạy tại:

```text
http://localhost:3000
```

Build production:

```bash
npm run build
```

Chạy bản production sau khi build:

```bash
npm start
```

## Kết nối backend

Frontend gọi API qua Axios và RTK Query. Token đăng nhập được gắn vào header:

```text
Authorization: Bearer <accessToken>
```

Khi backend trả về `401`, ứng dụng sẽ gọi `/auth/refresh` bằng HttpOnly refresh cookie, lưu access token mới và thử lại request cũ. Nếu refresh thất bại hoặc cookie không được gửi, ứng dụng mới chuyển người dùng về trang đăng nhập.

Nếu frontend gọi API trực tiếp sang domain khác, backend cần cấu hình CORS cho origin frontend, ví dụ:

```text
http://localhost:3000
```

## Cấu trúc thư mục chính

```text
src
├─ app          # route, layout, page theo Next.js App Router
├─ components   # component dùng chung và component theo nghiệp vụ
├─ hooks        # custom hooks
├─ lib          # axios instance, constants, utils
├─ store        # Redux store, slices, RTK Query services
├─ types        # TypeScript types
└─ __tests__    # test
```

## Kiểm thử và build

Chạy toàn bộ test:

```bash
npm run test
```

Chạy lint:

```bash
npm run lint
```

Build production:

```bash
npm run build
```

## Deploy Cloudflare

Preview bằng OpenNext:

```bash
npm run preview
```

Deploy:

```bash
npm run deploy
```

Trước khi deploy, kiểm tra lại:

- `NEXT_PUBLIC_API_BASE_URL` trỏ đúng backend production
- `NEXT_PUBLIC_SITE_URL` trỏ đúng domain frontend
- Backend đã cho phép CORS từ domain frontend
- Backend set refresh cookie đúng môi trường HTTPS: `AUTH_COOKIE_SECURE=true` và `AUTH_COOKIE_SAME_SITE=None` nếu frontend/backend khác site

## Trạng thái dự án

- Đã hoàn thành các màn hình chính cho quản lý kho, nhập hàng, xuất hàng, tồn kho, báo cáo, phân quyền và AI assistant.
- Có cấu trúc component, types, hooks và service tách theo nghiệp vụ.
- Có thể cải thiện thêm bằng ảnh demo/GIF, e2e test, accessibility audit và CI/CD cho production deployment.
