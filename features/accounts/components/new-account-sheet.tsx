import { z } from "zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { insertAccountSchema } from "@/db/schema";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";

import { AccountForm } from "./account-form";

const formSchema = insertAccountSchema.pick({
  name: true,
  role: true,
});

type FormValues = z.infer<typeof formSchema>;

export const NewAccountSheet = () => {
  const { isOpen, onClose } = useNewAccount();
  const mutation = useCreateAccount();

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
      <Sheet open={isOpen || mutation.isPending} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Akun Baru</SheetTitle>

            <SheetDescription>
              Buat akun baru untuk melacak transaksi Anda.
            </SheetDescription>
          </SheetHeader>

          <AccountForm
            defaultValues={{
              name: "",
              role: "Sales",
            }}
            onSubmit={onSubmit}
            disabled={mutation.isPending}
          />
      </SheetContent>
    </Sheet>
  );
};
