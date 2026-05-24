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

### Dashboard và theo dõi vận hành

- Hiển thị số liệu tổng quan về kho, sản phẩm, tồn kho, nhập hàng và xuất hàng.
- Theo dõi cảnh báo tồn kho thấp, hàng gần hết hạn và các chỉ số cần xử lý.
- Truy cập nhanh tới các nghiệp vụ thường dùng trong hệ thống.

### Quản lý danh mục và dữ liệu nền

- Quản lý sản phẩm: thêm, sửa, xóa, tìm kiếm, lọc dữ liệu, import/export Excel.
- Quản lý danh mục sản phẩm để phân nhóm hàng hóa.
- Quản lý nhà cung cấp, khách hàng, kho và vị trí lưu trữ.
- Hỗ trợ các màn chi tiết, tạo mới và chỉnh sửa theo từng loại dữ liệu.

### Quản lý tồn kho

- Xem danh sách tồn kho theo sản phẩm, kho, vị trí và trạng thái.
- Theo dõi lịch sử dịch chuyển tồn kho.
- Cảnh báo tồn thấp, gần hết hạn và hỗ trợ xuất báo cáo Excel.
- Hỗ trợ điều chỉnh tồn kho theo quyền của người dùng.

### Nghiệp vụ nhập hàng

- Quản lý đơn nhập hàng `Purchase Order`.
- Quản lý dòng hàng trong đơn nhập.
- Tạo và theo dõi phiếu nhập kho.
- Quản lý tác vụ putaway sau khi hàng được nhập.
- Hỗ trợ gợi ý vị trí putaway bằng AI.

### Nghiệp vụ xuất hàng

- Quản lý đơn xuất hàng `Sales Order`.
- Quản lý dòng hàng trong đơn xuất.
- Theo dõi tác vụ picking và trạng thái xử lý.
- Hỗ trợ các thao tác assign, hoàn tất picking và xử lý ngoại lệ.

### Kiểm kê, hoàn trả và báo cáo

- Quản lý phiếu kiểm kê kho theo trạng thái.
- Ghi nhận số lượng kiểm kê và xử lý chênh lệch.
- Quản lý hoàn trả hàng từ khách hàng hoặc nhà cung cấp.
- Xem báo cáo tổng hợp, báo cáo tồn kho và xuất dữ liệu Excel.

### Thông báo và nhật ký

- Hiển thị thông báo hệ thống.
- Theo dõi nhật ký hoạt động để phục vụ kiểm tra và truy vết thao tác.

### Tài khoản, phân quyền và cài đặt

- Đăng nhập, đăng xuất và xem thông tin tài khoản hiện tại.
- Cập nhật hồ sơ cá nhân và đổi mật khẩu.
- Quản lý người dùng, vai trò và phân quyền truy cập.
- Cấu hình giao diện cá nhân và cấu hình AI.

## Giao diện admin

Khu vực admin tập trung vào quản trị người dùng, vai trò, phân quyền và theo dõi vận hành hệ thống. Các màn hình chính:

| Màn hình | Mục đích |
| --- | --- |
| Dashboard admin | Theo dõi nhanh số liệu vận hành, cảnh báo và trạng thái hệ thống |
| Quản lý người dùng | Xem danh sách tài khoản, tạo tài khoản, cập nhật thông tin và reset mật khẩu |
| Vai trò và phân quyền | Gán quyền theo vai trò như `ADMIN`, `WAREHOUSE_MANAGER`, `WAREHOUSE_STAFF` |
| Nhật ký hoạt động | Kiểm tra lịch sử thao tác của người dùng trong hệ thống |
| Cấu hình hệ thống | Cấu hình hồ sơ, giao diện, mật khẩu và kết nối AI |

Ảnh minh họa giao diện admin:

![Dashboard admin](/screenshots/admin-dashboard.png)

![Quản lý phân quyền admin](/screenshots/admin-security.png)

![Cài đặt admin](/screenshots/admin-settings.png)

> Lưu ảnh chụp màn hình vào `public/screenshots/` với đúng tên file ở trên để README hiển thị ảnh trực tiếp trên GitHub.

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
