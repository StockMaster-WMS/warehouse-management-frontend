# Bao cao test giao dien thuc te - 2026-05-25

Moi truong:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:9000`
- Cong cu: Chrome DevTools MCP, Chrome viewport desktop `1440x900`, mobile gan dung `500x844`
- Tai khoan da test: `admin`, `manager`, `staff`, `report`

## 1. Tom tat nhanh

| Hang muc | Ket qua |
| --- | --- |
| Login Admin | Dat, `/api/auth/login` tra 200 |
| Login Manager | Dat, menu khong hien cau hinh/bao mat |
| Login Staff | Dat, sau login vao `/picking`, menu chi con nghiep vu kho lien quan |
| Login Report User | Dat, chi thay dashboard, AI, inventory/warehouse xem, reports |
| Chan route trai quyen | Dat so bo: Staff vao `/security` bi dua ve `/picking`; Report vao `/orders/new` bi dua ve `/dashboard` |
| Cac man desktop chinh | Render duoc, API phan lon 200 |
| Mobile/responsive | Co mot so loi UI can sua, nhat la bang san pham va reports |
| Export Excel reports | Loi nghiem trong: API export tra 500 |
| Console | Co Recharts warning, Chrome accessibility issues, Redux non-serializable khi export fail |

## 2. Giao dien da test

| Nhom | Route da mo | Ket qua |
| --- | --- | --- |
| Public/Auth | `/`, `/login` | Render OK, login OK |
| Dashboard | `/dashboard` | Render OK, co warning chart |
| Danh muc | `/products`, `/categories`, `/suppliers`, `/customers`, `/warehouses`, `/locations`, `/products/new` | Render OK, nhieu issue accessibility/icon button |
| Ton kho | `/inventory` | Render OK, API ton kho 200 |
| Nhap hang | `/purchase-orders` | Render OK, API 200 |
| Xuat hang | `/orders`, `/orders/new`, `/picking` | Render OK, Staff picking OK |
| Bao cao | `/reports` | Render OK, nhung export Excel loi 500 |
| Quan tri | `/security` | Render OK voi Admin, Staff bi redirect dung |
| AI | `/ai-assistant` | Gui cau hoi OK trong lan test truoc, API stream 200 |

## 3. Bang loi/chua on

| ID | Muc do | Giao dien | Mo ta loi | Bang chung | De xuat |
| --- | --- | --- | --- | --- | --- |
| UI-001 | Cao | `/reports` | Bam `Tai bao cao Excel` goi `GET /api/reports/summary/export?period=30d` va backend tra 500 | Network request `1747` status 500; console `Failed to load resource: 500` | Kiem tra backend export endpoint, response blob/content-type, exception khi tao file |
| UI-002 | Trung binh | `/reports` | Redux warning non-serializable payload Blob khi export loi | Console: `A non-serializable value was detected in an action, in the path: payload.data. Value: [object Blob]` | Khong dua Blob loi vao Redux action hoac custom serialize/transform response error |
| UI-003 | Trung binh | `/dashboard`, `/reports` | Recharts render khi container chua co kich thuoc, warning `width(-1)` va `height(-1)` | Console warning lap 2 lan tren dashboard/reports | Dat `min-height`, `aspect-ratio`, wrapper on dinh; chi render chart sau khi co data/container |
| UI-004 | Trung binh | Mobile `/products` | Mobile van hien header bang desktop `STT, MA HANG, TEN SAN PHAM...` phia tren card san pham, gay roi UI | Screenshot `docs/screenshots-mobile-products.png`; evaluate thay table width 1200 nam trong viewport mobile | An table header desktop tren mobile hoac tach mobile card/table bang breakpoint ro rang |
| UI-005 | Trung binh | `/reports` mobile | Select kho hien raw sentinel `__all__`, khong phai text nguoi dung | Snapshot reports: combobox value `__all__`; screenshot `docs/screenshots-mobile-reports.png` | Hien label `Tat ca kho` thay vi raw value |
| UI-006 | Thap/Trung binh | `/reports` mobile | Date input hien placeholder mac dinh `mm/dd/yyyy`, lech ngon ngu UI tieng Viet | Screenshot `docs/screenshots-mobile-reports.png` | Dung date picker Viet hoa hoac helper text `dd/mm/yyyy`; format gia tri hien thi theo `vi-VN` |
| UI-007 | Trung binh accessibility | `/orders/new` | 9 form field khong co label associated, 2 field thieu `id/name` | Chrome issue: `No label associated with a form field (count: 9)` | Them `id`, `name`, `aria-label`/`htmlFor` cho combobox/input |
| UI-008 | Trung binh accessibility | `/categories` | Nhieu icon button khong co accessible name | Evaluate desktop: `emptyBtns=80` | Them `aria-label`/tooltip cho nut expand/edit/delete/action |
| UI-009 | Trung binh accessibility | `/locations` | Nhieu icon button khong co accessible name | Evaluate desktop: `emptyBtns=48` | Them `aria-label` cho nut sua, in barcode, xoa, refresh, action row |
| UI-010 | Thap accessibility | `/suppliers`, `/customers`, `/warehouses`, `/inventory`, `/purchase-orders`, `/orders`, `/picking`, `/security`, `/ai-assistant` | Lap lai issue field thieu `id` hoac `name` | Chrome issue count 1-3 tuy man | Audit form shared components: SearchToolbar, Select/Combobox, Date input |
| UI-011 | Thap | Dev mode all pages | Nut Next.js Dev Tools hinh tron `N` o goc duoi trai che noi dung khi test mobile | Screenshot mobile co vong tron `N` | Dev-only, khong can fix production; khi quay demo co the tat Next dev tools neu gay roi |
| UI-012 | Thap dev performance | `/customers` | Redux immutable middleware cham 102ms trong dev | Console warning `ImmutableStateInvariantMiddleware took 102ms` | Chi can theo doi neu production cung lag; dev warning co the bo qua |

## 4. Phan quyen da xac minh

| Tai khoan | Sau login | Menu thay duoc | Test truy cap trai quyen |
| --- | --- | --- | --- |
| Admin | `/dashboard` | Day du: dashboard, AI, inventory, warehouses, locations, cycle counts, products, customers, suppliers, purchase orders, inbound, putaway, orders, picking, returns, reports, history, settings, security | Chua test route bi chan vi admin toan quyen |
| Manager | `/dashboard` | Khong thay `Cau hinh he thong` va `Bao mat & phan quyen`; van thay cac nghiep vu kho, danh muc, reports/history | Chua thay loi so bo |
| Staff | `/picking` | Chi thay inventory, locations, cycle counts, inbound, putaway, picking, returns | Vao `/security` bi dua ve `/picking` |
| Report | `/dashboard` | Dashboard, AI, inventory, warehouses, reports | Vao `/orders/new` bi dua ve `/dashboard` |

## 5. Anh chup da luu

| Anh | Noi dung |
| --- | --- |
| `docs/screenshots-mobile-dashboard.png` | Dashboard mobile, co chart warning tren console |
| `docs/screenshots-mobile-products.png` | Products mobile, thay header bang desktop va card mobile |
| `docs/screenshots-mobile-locations.png` | Locations mobile |
| `docs/screenshots-mobile-product-new.png` | Form tao san pham mobile |
| `docs/screenshots-mobile-order-new.png` | Form tao don xuat mobile, co issue label |
| `docs/screenshots-mobile-reports.png` | Reports mobile, thay `__all__`, `mm/dd/yyyy` |

## 6. Uu tien sua

1. Sua export Excel reports tra 500.
2. Sua dashboard/reports chart container Recharts.
3. Sua mobile `/products` de khong hien header table desktop tren card mobile.
4. Sua raw label `__all__` va date placeholder tren reports.
5. Audit accessibility cho shared controls: button icon, search input, combobox, date input.
6. Viet smoke test tu dong moi cho login 4 role va route matrix, tranh phu thuoc thao tac tay.

