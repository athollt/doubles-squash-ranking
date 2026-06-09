import { redirect } from "next/navigation";

// Placeholder root (step 21). The real landing / league switcher is step 22; for
// now / sends visitors to the seed BSC league's public ladder, preserving today's
// "root shows the live ladder" behaviour and existing bookmarks to /.
export default function RootRedirect() {
  redirect("/l/bsc-doubles-squash");
}
