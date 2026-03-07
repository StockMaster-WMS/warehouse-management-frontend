import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SegmentRow = {
  id: string;
  name: string;
  contacts: number;
};

const segments: SegmentRow[] = [
  { id: "new-subscribers", name: "New Subscribers", contacts: 0 },
  { id: "sms-subscribers", name: "SMS Subscribers", contacts: 0 },
  { id: "email-subscribers", name: "Email Subscribers", contacts: 0 },
  { id: "recent-buyers", name: "Recent Buyers", contacts: 0 },
  { id: "vip-customers", name: "VIP Customers", contacts: 0 },
  { id: "inactive-customers", name: "Inactive Customers", contacts: 0 },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Quan ly Segment</h1>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-lg bg-[#5B5BD6] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4D4DB5]"
        >
          Tao Segment moi
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative mb-4 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tim kiem segment"
            className="h-10 rounded-lg border-slate-200 bg-white pl-9 text-slate-700"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox aria-label="Chon tat ca" />
              </TableHead>
              <TableHead>Ten Segment</TableHead>
              <TableHead>So luong lien he</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.map((segment) => (
              <TableRow key={segment.id}>
                <TableCell>
                  <Checkbox aria-label={`Chon ${segment.name}`} />
                </TableCell>
                <TableCell className="font-medium text-slate-900">{segment.name}</TableCell>
                <TableCell>{segment.contacts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
