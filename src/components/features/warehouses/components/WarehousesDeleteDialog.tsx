import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";

type WarehousesDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => Promise<void>;
};

export function WarehousesDeleteDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
}: WarehousesDeleteDialogProps) {
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      itemName={itemName}
      title="Xóa kho hàng"
      description="Xóa kho hàng sẽ gỡ bỏ mọi thông tin truy xuất. Hãy chắc chắn kho đã trống trước khi thực hiện."
    />
  );
}
