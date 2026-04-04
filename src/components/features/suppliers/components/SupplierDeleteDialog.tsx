import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";

type SupplierDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onConfirm: () => Promise<void>;
};

export function SupplierDeleteDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
}: SupplierDeleteDialogProps) {
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      itemName={itemName}
      title="Xóa nhà cung cấp"
      description="Bạn có chắc muốn xóa nhà cung cấp này? Mọi dữ liệu liên quan sẽ bị ảnh hưởng."
    />
  );
}
