# Ke hoach test chuc nang theo luong giao dien StockMaster WMS

Ngay lap: 2026-05-25  
Moi truong test: Frontend `http://localhost:3000`, Backend `http://localhost:9000`  
Cong cu de xuat: Chrome DevTools MCP, Puppeteer/Playwright, Vitest, Lighthouse

## 1. Tai khoan va pham vi quyen

| Vai tro | Username | Password | Muc tieu test |
| --- | --- | --- | --- |
| Admin | `admin` | `Admin@12345` | Toan quyen: danh muc, nhap xuat, kiem ke, bao cao, phan quyen, cau hinh, AI |
| Manager | `manager` | `Manager@12345` | Quan ly van hanh: danh muc nghiep vu, ton kho, nhap xuat, kiem ke, bao cao |
| Staff | `staff` | `Staff@12345` | Tac nghiep kho: nhap hang, xep hang, lay hang, kiem ke, xem ton kho theo pham vi duoc gan |
| Report User | `report` | `Report@12345` | Xem dashboard, bao cao, thong ke; khong duoc sua du lieu nghiep vu |

## 2. Nguyen tac test chung

| Hang muc | Cach kiem tra | Ket qua mong doi |
| --- | --- | --- |
| Render UI | Mo tung route bang Chrome DevTools MCP | Trang hien dung tieu de, khong trang trang, khong application error |
| Console | Doc console sau moi thao tac | Khong co `error`, `Unhandled Runtime Error`; warning can duoc ghi nhan |
| Network | Theo doi request API | API chinh tra 2xx; 401/403 chi xuat hien khi dung quyen bi chan |
| Phan quyen | Dang nhap tung vai tro va mo route | Menu, nut hanh dong, API duoc hien/chan dung vai tro |
| Du lieu | Tao/sua/xac nhan nghiep vu | Backend cap nhat dung, UI reload dung, lich su/bao cao co du lieu moi |
| Validation | Submit form thieu/sai du lieu | UI bao loi ro rang, khong gui request tao du lieu sai |
| Audit | Sau thao tac nghiep vu mo History/Reports | Co ban ghi lich su, so lieu thong ke thay doi phu hop |
| Accessibility co ban | Chrome Issues, label/input, keyboard focus | Input co label/id/name, nut co ten truy cap, focus khong bi mat |

## 3. Luong dang nhap va phan quyen

### Giao dien lien quan

| Giao dien | Route | Vai tro test |
| --- | --- | --- |
| Trang public | `/` | Tat ca/chua dang nhap |
| Dang nhap | `/login` | Tat ca |
| Dashboard | `/dashboard` | Admin, Manager, Staff, Report |
| Sidebar/Menu | Layout trong dashboard | Admin, Manager, Staff, Report |
| Bao mat & phan quyen | `/security` | Admin, Manager, Staff, Report |
| Ho so ca nhan | `/profile` | Admin, Manager, Staff, Report |
| Cai dat | `/settings` | Admin, Manager |

### Test case chi tiet

| ID | Buoc test | Tai khoan | Ket qua mong doi |
| --- | --- | --- | --- |
| AUTH-01 | Mo `/login`, nhap dung username/password | Tat ca | Dang nhap thanh cong, chuyen den dashboard phu hop |
| AUTH-02 | Nhap sai mat khau | Tat ca | Hien thong bao sai thong tin, khong luu token |
| AUTH-03 | Tick "Ghi nho tai khoan", reload login | Tat ca | Username duoc nho, password khong bi luu ro |
| AUTH-04 | Dung nut doi che do username/email | Admin | Dang nhap bang username va email deu dung neu backend ho tro |
| AUTH-05 | Mo route khong du quyen, vi du Staff vao `/security` | Staff | Bi an menu hoac bi chan 403/redirect dung |
| AUTH-06 | Report User mo route tao/sua, vi du `/products/new` | Report | Bi chan thao tac ghi du lieu |
| AUTH-07 | Het token/refresh token | Tat ca | Tu refresh thanh cong hoac ve `/login` neu refresh fail |
| AUTH-08 | Logout tu avatar menu | Tat ca | Xoa token, ve `/login`, route protected khong vao duoc |

## 4. Luong quan ly danh muc

### Giao dien lien quan

| Nhom danh muc | Route danh sach | Route tao/sua | Vai tro chinh |
| --- | --- | --- | --- |
| San pham | `/products` | `/products/new`, `/products/[id]`, `/products/[id]/edit` | Admin, Manager |
| Nhom hang | `/categories` | Dialog tao/sua trong trang | Admin, Manager |
| Nha cung cap | `/suppliers` | `/suppliers/new`, `/suppliers/[id]`, `/suppliers/[id]/edit` | Admin, Manager |
| Khach hang | `/customers` | `/customers/new`, `/customers/[id]/edit` | Admin, Manager |
| Kho hang | `/warehouses` | `/warehouses/new`, `/warehouses/[id]/edit` | Admin, Manager |
| Vi tri luu tru | `/locations` | Dialog tao/sua/bulk | Admin, Manager |
| Nguoi dung | `/security` | Dialog tao/sua/reset mat khau/import | Admin |

### Test case chi tiet

| ID | Giao dien | Buoc test | Ket qua mong doi |
| --- | --- | --- | --- |
| CAT-01 | Products | Tim kiem theo ten/ma, doi trang, loc danh muc | Danh sach cap nhat dung, API 2xx |
| CAT-02 | Products New | Submit trong form trong | Bao loi ten san pham va nhom hang bat buoc |
| CAT-03 | Products New | Tao san pham moi voi barcode, ten, category, supplier, UOM, nguong ton | Tao thanh cong, quay ve detail/list, san pham co trong danh sach |
| CAT-04 | Products Edit | Sua ten/nguong ton/co fragile | Luu thanh cong, detail hien gia tri moi |
| CAT-05 | Products | Xoa/ngung kich hoat san pham | Co dialog xac nhan, du lieu thay doi dung |
| CAT-06 | Categories | Tao category cha/con, sua ten, xoa category khong su dung | Tree hien dung cap bac, validate trung ma/ten |
| CAT-07 | Suppliers | Tao/sua nha cung cap, validate email/MST/phone | Loi validation ro, data dung sau khi luu |
| CAT-08 | Customers | Tao/sua khach hang, tim theo email/phone | Data dung, khong loi API |
| CAT-09 | Warehouses | Tao kho moi, gan manager | Kho hien trong list, summary cap nhat |
| CAT-10 | Locations | Tao vi tri, bulk create, in barcode | Vi tri tao dung warehouse/zone, modal barcode hien dung |
| CAT-11 | Security | Admin tao user moi va gan role | User dang nhap duoc, menu theo role moi |
| CAT-12 | Security | Import user Excel sai header | Bao loi header/row ro rang, khong tao user sai |

## 5. Luong nhap hang

### Giao dien lien quan

| Nghiep vu | Route | Vai tro chinh |
| --- | --- | --- |
| Don nhap hang | `/purchase-orders` | Admin, Manager, Staff tuy quyen |
| Tao don nhap | `/purchase-orders/new` | Admin, Manager |
| Chi tiet don nhap | `/purchase-orders/[id]` | Admin, Manager, Staff |
| Phieu nhap kho | `/inbound` | Admin, Manager, Staff |
| Tao phieu nhap | `/inbound/new` | Admin, Manager, Staff |
| Xep hang len ke | `/putaway` | Admin, Manager, Staff |
| Ton kho | `/inventory` | Admin, Manager, Staff |
| Lich su | `/history` | Admin, Manager |
| Bao cao | `/reports` | Admin, Manager, Report |

### Test case chi tiet

| ID | Buoc test | Ket qua mong doi |
| --- | --- | --- |
| IN-01 | Tao PO moi: chon supplier, warehouse, them 1-2 san pham va so luong | PO tao thanh cong, trang detail hien line items |
| IN-02 | Submit PO thieu supplier/san pham/so luong | UI bao loi, khong tao PO |
| IN-03 | Xac nhan/duyet PO neu co trang thai | Trang thai PO thay doi dung |
| IN-04 | Tao phieu nhap tu PO | Receipt lien ket dung PO va line items |
| IN-05 | Xac nhan nhap hang | Ton kho tang dung san pham/kho/lo/hsd neu co |
| IN-06 | Tao receipt so luong lon hon PO | He thong chan hoac canh bao theo rule backend |
| IN-07 | Tao putaway task sau nhap | Task xep hang hien trong `/putaway` |
| IN-08 | Hoan thanh putaway vao vi tri | Stock level co location moi, status task hoan thanh |
| IN-09 | Mo `/history` sau khi nhap | Co audit log tao/xac nhan receipt/putaway |
| IN-10 | Mo `/reports` | So lieu nhap hang/ton kho cap nhat |

## 6. Luong xuat hang

### Giao dien lien quan

| Nghiep vu | Route | Vai tro chinh |
| --- | --- | --- |
| Don xuat hang | `/orders` | Admin, Manager, Staff |
| Tao don xuat | `/orders/new` | Admin, Manager, Staff tuy quyen |
| Chi tiet don xuat | `/orders/[id]` | Admin, Manager, Staff |
| Lay hang | `/picking` | Admin, Manager, Staff |
| Ton kho | `/inventory` | Admin, Manager, Staff |
| Khach hang | `/customers` | Admin, Manager |
| Lich su/Bao cao | `/history`, `/reports` | Admin, Manager, Report |

### Test case chi tiet

| ID | Buoc test | Ket qua mong doi |
| --- | --- | --- |
| OUT-01 | Tao sales order voi khach hang, warehouse, san pham con ton | Don tao thanh cong |
| OUT-02 | Tao sales order voi so luong vuot ton | UI/backend canh bao khong du ton, khong xac nhan xuat |
| OUT-03 | Chuyen don sang trang thai picking | Picking item duoc tao |
| OUT-04 | Mo `/picking`, loc theo ngay/status, gan nhan vien | Danh sach dung, gan assignee thanh cong |
| OUT-05 | Hoan thanh picking mot phan/toan bo | Trang thai item/order cap nhat dung |
| OUT-06 | Xac nhan xuat kho | Ton kho giam dung theo product/warehouse/location/lot |
| OUT-07 | In/export phieu xuat neu co | Modal/print hien dung thong tin |
| OUT-08 | Kiem tra audit va report sau xuat | History co log, report xuat hang cap nhat |

## 7. Luong kiem ke kho

### Giao dien lien quan

| Nghiep vu | Route | Vai tro chinh |
| --- | --- | --- |
| Danh sach kiem ke | `/cycle-counts` | Admin, Manager, Staff |
| Chi tiet ky kiem ke | `/cycle-counts/[id]` | Admin, Manager, Staff |
| Ton kho | `/inventory` | Admin, Manager, Staff |
| Lich su | `/history` | Admin, Manager |

### Test case chi tiet

| ID | Buoc test | Ket qua mong doi |
| --- | --- | --- |
| CC-01 | Tao ky kiem ke theo kho/vi tri/san pham | Ky kiem ke tao thanh cong |
| CC-02 | Gan nhan vien kiem ke | Staff thay nhiem vu hoac danh sach duoc gan |
| CC-03 | Nhap so luong thuc te bang so luong he thong | Khong phat sinh chenhlech |
| CC-04 | Nhap so luong thuc te khac database | Hien chenhlech, can review/dieu chinh |
| CC-05 | Manager phe duyet dieu chinh | Ton kho cap nhat, audit log ghi nhan |
| CC-06 | Staff thu phe duyet dieu chinh neu khong co quyen | Bi chan dung phan quyen |
| CC-07 | Loc/search ky kiem ke theo status/ngay/kho | Ket qua dung |

## 8. Luong theo doi ton kho

### Giao dien lien quan

| Giao dien | Route | Vai tro |
| --- | --- | --- |
| Ton kho | `/inventory` | Admin, Manager, Staff |
| San pham detail | `/products/[id]` | Admin, Manager, Staff |
| Kho hang | `/warehouses` | Admin, Manager, Staff xem |
| Vi tri | `/locations` | Admin, Manager, Staff xem |
| Dashboard | `/dashboard` | Tat ca vai tro da dang nhap |

### Test case chi tiet

| ID | Buoc test | Ket qua mong doi |
| --- | --- | --- |
| INV-01 | Loc ton theo product, warehouse, location | Ket qua dung, khong mat pagination |
| INV-02 | Tim kiem SKU/ten san pham | Tra dung dong ton kho |
| INV-03 | Kiem tra card tong ton, available, reserved, low stock | So lieu khop API/backend |
| INV-04 | Tao giao dich nhap roi quay lai inventory | Ton tang |
| INV-05 | Tao giao dich xuat roi quay lai inventory | Ton giam |
| INV-06 | San pham duoi nguong minStock | Co canh bao ton thap |
| INV-07 | San pham co han dung gan het | Co canh bao near expiry neu co du lieu |
| INV-08 | Staff chi xem kho duoc gan | Du lieu bi gioi han theo quyen/kho |

## 9. Luong bao cao va thong ke

### Giao dien lien quan

| Giao dien | Route | Vai tro |
| --- | --- | --- |
| Dashboard | `/dashboard` | Admin, Manager, Report |
| Bao cao van hanh | `/reports` | Admin, Manager, Report |
| Lich su he thong | `/history` | Admin, Manager |
| Thong bao | `/notifications` | Tat ca |

### Test case chi tiet

| ID | Buoc test | Ket qua mong doi |
| --- | --- | --- |
| REP-01 | Report User dang nhap va mo `/reports` | Xem duoc bao cao, khong co nut sua/xoa |
| REP-02 | Doi bo loc ngay: hom nay, 7 ngay, 1 thang, nam | Chart/card cap nhat dung |
| REP-03 | Sau khi tao nhap hang | Bao cao nhap hang thay doi |
| REP-04 | Sau khi tao xuat hang | Bao cao xuat hang/doanh thu/throughput thay doi |
| REP-05 | Sau khi kiem ke co chenhlech | Bao cao kiem ke/lich su co ban ghi |
| REP-06 | Mo dashboard voi tung vai tro | Card/chi so hien dung theo quyen |
| REP-07 | Mo notifications va danh dau da doc | Unread count giam dung |

## 10. Luong AI ho tro

### Giao dien lien quan

| Giao dien | Route | Vai tro |
| --- | --- | --- |
| Tro ly thong minh | `/ai-assistant` | Admin, Manager, Staff, Report tuy cau hinh |
| Cau hinh AI | `/settings` hoac tab AI settings | Admin |

### Test case chi tiet

| ID | Buoc test | Ket qua mong doi |
| --- | --- | --- |
| AI-01 | Mo `/ai-assistant` | UI hien khung chat, model selector, input |
| AI-02 | Gui cau "Tom tat ton kho hom nay" | API stream 200, tra cau tra loi co so lieu |
| AI-03 | Gui cau hoi ve san pham sap het hang | Tra loi dung ngu canh inventory |
| AI-04 | Gui cau hoi ve don xuat can uu tien | Tra loi dung ngu canh outbound |
| AI-05 | Gui cau hoi khong lien quan | AI tra loi an toan/huong ve nghiep vu kho |
| AI-06 | Tat backend AI hoac provider loi | UI hien thong bao loi ro, khong crash |
| AI-07 | Staff/Report hoi du lieu khong du quyen | Backend/AI khong ro ri du lieu ngoai quyen |
| AI-08 | Cau hinh API key/model | Chi Admin duoc sua, luu thanh cong va khong hien plaintext key |

## 11. Luong xuat Excel bao cao

### Giao dien lien quan

| Giao dien | Route | Chuc nang can test |
| --- | --- | --- |
| Products | `/products` | Nhap/Xuat Excel san pham |
| Suppliers | `/suppliers` | Xuat danh sach nha cung cap |
| Customers | `/customers` | Xuat danh sach khach hang |
| Purchase Orders | `/purchase-orders` | Xuat danh sach/chi tiet don nhap |
| Orders | `/orders` | Xuat danh sach/chi tiet don xuat |
| Reports | `/reports` | Xuat bao cao thong ke |
| Security | `/security` | Import/export user neu co |

### Test case chi tiet

| ID | Buoc test | Ket qua mong doi |
| --- | --- | --- |
| XLS-01 | Products: bam Export Excel | Tai file `.xlsx`, header dung, du lieu khop filter hien tai |
| XLS-02 | Products: import file dung template | Import thanh cong, san pham moi hien trong list |
| XLS-03 | Products: import file sai header | Bao loi tung dong/header, khong tao du lieu sai |
| XLS-04 | Reports: xuat bao cao theo khoang ngay | File co so lieu dung bo loc |
| XLS-05 | Security: import user hop le | User duoc tao, role dung |
| XLS-06 | Security: import trung username/email | Bao loi, khong tao trung |
| XLS-07 | Kiem tra ten file | Ten file co nghia, co ngay/thoi gian neu can |
| XLS-08 | Kiem tra quyen | Report User chi xuat bao cao duoc phep, khong export danh muc nhay cam |

## 12. Luong hieu suat trang web

### Giao dien uu tien do

| Route | Ly do uu tien |
| --- | --- |
| `/` | Trang public, SEO, first load |
| `/login` | First interaction quan trong |
| `/dashboard` | Nhieu chart, nhieu API |
| `/products` | Bang lon, filter, pagination |
| `/inventory` | Du lieu ton kho lon |
| `/orders` | Filter theo ngay/status |
| `/picking` | Co scanner/mobile mode |
| `/reports` | Chart va tong hop du lieu |
| `/ai-assistant` | Stream response |

### Chi so can do

| ID | Chi so | Muc tieu de xuat |
| --- | --- | --- |
| PERF-01 | Lighthouse Performance desktop | >= 85 |
| PERF-02 | Lighthouse Accessibility | >= 90 |
| PERF-03 | LCP | < 2.5s tren may local/dev hop ly |
| PERF-04 | CLS | < 0.1 |
| PERF-05 | INP/TBT | Khong co task dai gay lag khi filter/search |
| PERF-06 | API waterfall | Khong goi lap API khong can thiet, khong polling qua day |
| PERF-07 | Bundle/chunk | Chunk route khong qua lon bat thuong |
| PERF-08 | Chart/table render | Khong warning size container, table khong giat khi doi filter |

## 13. Bang tong hop ket qua test so bo bang Chrome DevTools MCP

Da kiem tra so bo ngay 2026-05-25 voi tai khoan `admin`.

| Hang muc | Giao dien/Route | Ket qua | Muc do | Ghi chu |
| --- | --- | --- | --- | --- |
| Landing page | `/` | Dat | Thap | Render OK, request 200, khong console error |
| Dang nhap | `/login` | Dat | Thap | Login `admin / Admin@12345` thanh cong, `/auth/login` 200 |
| Dashboard | `/dashboard` | Can sua nho | Trung binh | Recharts warning: chart container co luc `width(-1)` va `height(-1)` |
| Products list | `/products` | Can sua nho | Thap | Render OK, API 200; Chrome issue: field thieu `id` hoac `name` |
| Inventory | `/inventory` | Can sua nho | Thap | Render OK, API 200; Chrome issue: field thieu `id` hoac `name` |
| Purchase Orders | `/purchase-orders` | Can sua nho | Thap | Render OK, API 200; Chrome issue: 2 field thieu `id` hoac `name` |
| Orders | `/orders` | Can sua nho | Thap | Render OK, API 200; Chrome issue: 2 field thieu `id` hoac `name` |
| Picking | `/picking` | Can sua nho | Thap | Render OK, API 200; Chrome issue: 2 field thieu `id` hoac `name` |
| Security | `/security` | Can sua nho | Thap | Render OK, API 200; Chrome issue: 3 field thieu `id` hoac `name` |
| Product create | `/products/new` | Can sua nho | Thap | Validation submit trong OK; warning thieu autocomplete va mot so field thieu `id/name` |
| AI Assistant | `/ai-assistant` | Dat chuc nang, can sua nho accessibility | Thap | Gui cau hoi thanh cong, stream API 200; Chrome issue: field thieu `id` hoac `name` |
| Vitest | `npm run test` | Dat | Thap | 3 files passed, 6 tests passed |

## 14. Bang loi/chua on can xu ly

| ID | Van de | Anh huong | Muc do | De xuat xu ly |
| --- | --- | --- | --- | --- |
| BUG-01 | Dashboard Recharts warning container `width(-1)`/`height(-1)` | Chart co the hien sai kich thuoc luc load, anh huong trai nghiem dashboard | Trung binh | Dat height/aspect-ratio/min-height on dinh cho chart container, chi render chart khi container san sang |
| BUG-02 | Nhieu form field thieu `id` hoac `name` | Accessibility, autofill, test automation va label association kem | Thap | Bo sung `id/name` cho input/combobox/search field, dam bao label `htmlFor` dung |
| BUG-03 | Mot input o `/products/new` thieu `autocomplete` | Chrome issue, trai nghiem autofill/accessibility nho | Thap | Them `autoComplete` phu hop hoac `autoComplete=\"off\"` neu khong can |
| BUG-04 | Puppeteer smoke script cu `ui-test.cjs` khong ghi log ro trong lan chay so bo | Kho dung lai de regression test tu dong | Thap | Viet lai smoke script co timeout tung route, headless on dinh, xuat JSON/Markdown report |
| RISK-01 | Chua test het CRUD tao/sua/xoa that voi du lieu moi | Chua dam bao day du nghiep vu end-to-end | Trung binh | Chay test theo flow voi data rieng co prefix `E2E-`, don dep sau test |
| RISK-02 | Chua test phan quyen voi Manager/Staff/Report User | Co nguy co menu/API chua chan dung | Cao | Dang nhap tung tai khoan, kiem tra route matrix va API 403/hidden actions |
| RISK-03 | Chua do Lighthouse/Core Web Vitals | Chua ket luan duoc hieu suat that | Trung binh | Chay Lighthouse desktop/mobile cho cac route uu tien, luu report |

## 15. Thu tu test de nghi khi nghiem thu

1. Test dang nhap va phan quyen cho 4 tai khoan.
2. Test danh muc nen: category, supplier, customer, warehouse, location, product, user.
3. Test nhap hang end-to-end: PO -> receipt -> putaway -> inventory -> history -> report.
4. Test xuat hang end-to-end: sales order -> picking -> confirm outbound -> inventory -> history -> report.
5. Test kiem ke: tao ky -> nhap thuc te -> ghi nhan chenhlech -> phe duyet -> inventory/history.
6. Test ton kho va canh bao: filter, search, low stock, near expiry, stock movement.
7. Test bao cao va xuat Excel.
8. Test AI assistant theo cau hoi nghiep vu va cau hoi ngoai pham vi.
9. Test hieu suat bang Lighthouse/DevTools Performance.
10. Tong hop loi vao bang BUG/RISK, gan muc do uu tien va nguoi phu trach.

