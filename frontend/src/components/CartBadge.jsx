import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart-store";

export default function CartBadge() {
  const { itemsTotal } = useCart();
  return (
    <Link to="/cart" className="relative">
      <Button variant="ghost" className="px-2">🛒</Button>
      {itemsTotal > 0 && (
        <span className="absolute -top-1 -right-1 text-[11px] px-1.5 py-0.5 rounded-full bg-black text-white">
          {itemsTotal}
        </span>
      )}
    </Link>
  );
}
