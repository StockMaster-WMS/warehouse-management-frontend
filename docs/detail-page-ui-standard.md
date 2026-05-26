# Detail Page UI Standard

## Current Inconsistencies

- Overall layout: supplier, return, and cycle count pages use `components/detail-page`, while product, purchase order, and sales order detail pages still build local cards and grids by hand.
- Header: some pages use `PageHeader`, some put entity code inside the title, and some show the back action as a primary header action. This makes the first viewport feel different between documents and master data.
- Cards: detail pages mix `Card`, raw `section`, `rounded-2xl`, `rounded-xl`, `bg-white`, `bg-card`, `border-slate-*`, and `border-border`. The visual weight changes from page to page.
- Status display: statuses are implemented as `DetailStatusBadge`, `StatusBadge`, local `StatusPill`, and inline `span` blocks. Dot size, radius, font weight, and colors are not consistent.
- Tables: purchase order, cycle count, product stock ledger, and order lines use different header padding, row density, sticky behavior, and empty states.
- Actions: some pages put all actions in the top header, others put operational actions in sidebars or bottom banners. Primary actions are also colored differently (`indigo`, `blue`, `emerald`, direct slate classes).
- Spacing: pages alternate between `space-y-4`, `space-y-5`, `space-y-6`, `p-6`, `px-6`, and custom table padding. Mobile layouts therefore stack at different rhythms.
- Typography: section titles range from `text-base` card titles to uppercase `text-sm` and `text-[10px]`. Entity codes are sometimes regular text and sometimes monospace.
- Information grouping: master data pages group by business/contact/terms; transaction pages often combine overview, status, timeline, lines, and notes in one long custom layout.
- Mobile: large tables generally scroll horizontally, but headers and actions are not always optimized for wrapping. Detail identity, status, and main action should stay visible and readable on narrow screens.

## Standard Layout

Use this structure for every detail page:

1. `DetailPageLayout`
   - Page-level spacing and bottom padding.
   - Do not add a second max-width wrapper inside a detail page.

2. `DetailPageHeader`
   - Back action, entity type, title, code, status, and top-level actions.
   - Title should be human-readable, code should be separate and monospace.
   - Use one primary action. Secondary/destructive actions use outline/destructive variants.

3. `DetailSummaryGrid`
   - 3 to 4 compact cards for the facts users need first: warehouse, partner, dates, progress, totals, owner.
   - Use `DetailSummaryItem` for consistent label, value, icon, and helper text.

4. `DetailGrid`
   - Main column: sections with high-density operational data.
   - Sidebar: status, audit/timestamps, related links, and low-frequency actions.

5. `DetailSection`
   - Information cards, notes, metadata, and grouped fields.
   - Inside fields use `DetailInfoField`.

6. `DetailTableSection`
   - Product lines, stock ledger, receipt history, picking tasks, putaway tasks, and audit rows.
   - Table headers should use `ui-table-header`; rows should use `ui-table-row`; labels should use `ui-label`.

## Component Rules

- Card radius: use the shared detail components, which now use `ui-surface` and the app radius tokens.
- Padding: card content should be `p-4 sm:p-5`; avoid ad hoc `p-6` unless a dense table or form specifically needs it.
- Status: use `DetailStatusBadge` with a shared status config per domain. Avoid inline `span` status pills.
- Text: labels use `ui-label`; entity codes use `font-mono`; primary values are `text-sm` to `text-base` and `font-semibold`.
- Color: prefer design tokens (`bg-card`, `bg-muted`, `border-border`, `text-muted-foreground`, `text-primary`) over raw slate/indigo classes. Reserve semantic colors for state.
- Actions: top-right is for global page actions; operational row actions stay inside the relevant section/table; repeated confirmation actions can use a bottom action bar.
- Responsive: header actions wrap; summary cards collapse to one column; main/sidebar grid stacks; tables use horizontal overflow.

## React/Tailwind Template

```tsx
<DetailPageLayout>
  <DetailPageHeader
    backHref="/purchase-orders"
    backLabel="Đơn nhập"
    eyebrow="Chi tiết đơn nhập"
    title="Đơn mua hàng"
    code={po.poNumber}
    status={<DetailStatusBadge status={po.status} statusConfig={PO_STATUS_CONFIG} />}
    description="Theo dõi nhập hàng, phiếu GRN, xếp kệ và lịch sử xử lý."
    actions={
      <>
        <Button variant="outline" size="sm">Làm mới</Button>
        <Button size="sm">Nhập hàng</Button>
      </>
    }
  />

  <DetailSummaryGrid>
    <DetailSummaryItem label="Kho nhận" value={warehouseName} />
    <DetailSummaryItem label="Nhà cung cấp" value={supplierName} />
    <DetailSummaryItem label="Ngày đặt" value={formatDate(po.orderDate)} />
    <DetailSummaryItem label="Tiến độ nhận" value={`${receivedQty}/${orderedQty}`} />
  </DetailSummaryGrid>

  <DetailGrid
    sidebar={
      <DetailSection title="Trạng thái & lịch sử">
        <DetailInfoField label="Ngày tạo" value={formatDateTime(po.createdAt)} />
        <DetailInfoField label="Cập nhật" value={formatDateTime(po.updatedAt)} />
      </DetailSection>
    }
  >
    <DetailTableSection title="Dòng hàng">
      <Table>
        <TableHeader className="ui-table-header">
          <TableRow>
            <TableHead className="ui-label p-3">Sản phẩm</TableHead>
            <TableHead className="ui-label p-3 text-right">Số lượng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="ui-table-row">
              <TableCell className="p-3">{item.productName}</TableCell>
              <TableCell className="p-3 text-right tabular-nums">{item.qty}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DetailTableSection>

    <DetailSection title="Ghi chú">
      <p className="text-sm text-muted-foreground">{po.note || "Không có ghi chú."}</p>
    </DetailSection>
  </DetailGrid>
</DetailPageLayout>
```

## Migration Priority

1. Product detail: replace `ProductHeroSection` + local sections with `DetailPageHeader`, `DetailSummaryGrid`, `DetailSection`, and `DetailTableSection`.
2. Purchase order detail: replace local `InfoRow`, `StatusPill`, raw cards, and tab table wrappers with shared detail components.
3. Sales order detail: align `OrderHero`, `OrderSidebar`, `OrderLinesSection`, and `OrderPickingSection` to `DetailSection` and `DetailTableSection`.
4. Cycle count detail: keep current flow, but move the status banner into `DetailSummaryGrid` and replace inline table styling with `DetailTableSection`.
5. Supplier/return detail: already closest to standard; only verify after the shared component changes.
