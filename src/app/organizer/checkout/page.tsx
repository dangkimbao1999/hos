import { CheckoutContent } from "@/components/checkout/checkout-content";
import { listCartItems } from "@/lib/supabase/packages";
import { getCurrentProfile } from "@/lib/supabase/server";

export default async function CheckoutPage() {
  const profile = await getCurrentProfile();
  const cartItems = profile ? await listCartItems(profile.id) : [];

  return <CheckoutContent cartItems={cartItems} />;
}
