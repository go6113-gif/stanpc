// Catch-all redirect to root when no filters are provided
import { redirect } from "next/navigation";

export default function ExploreRoot() {
  redirect("/");
}
