# Warehouse Management Frontend

Frontend cho hệ thống quản lý kho StockMaster. Ứng dụng cung cấp giao diện web để thao tác với sản phẩm, kho, tồn kho, nhập hàng, xuất hàng, kiểm kê, báo cáo, phân quyền và trợ lý AI.

## Công nghệ sử dụng

- Next.js 16, App Router
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

## Kết nối backend

Frontend gọi API qua Axios và RTK Query. Token đăng nhập được gắn vào header:

```text
Authorization: Bearer <accessToken>
```

Khi backend trả về `401`, ứng dụng sẽ xóa token local và chuyển người dùng về trang đăng nhập.

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

## Kiểm thử

Chạy toàn bộ test:

```bash
npm run test
```

Chạy lint:

```bash
npm run lint
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
