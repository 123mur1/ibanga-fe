import { redirect } from "next/navigation";

/** Keep old bookmarks working while driver management lives in the Users directory. */
export default function AdminDriversPage() {
  redirect("/dashboard/admin/users");
}
