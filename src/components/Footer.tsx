import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-[#eaeaea] border-t border-neutral-800 py-16 px-6 md:px-12 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-wider text-white">DENIM DYNASTY STUDIO</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Premium boys fashion and curated streetwear. Elevating everyday wear with exceptional craftsmanship and modern designs.
          </p>
          <p className="text-xs text-neutral-500">
            A brand of <span className="font-semibold text-neutral-400">JS Faisal Dresses</span>
          </p>
        </div>

        {/* Customer Service Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Support</h4>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>
              <Link href="/" className="hover:text-[#38BDF8] transition">Home</Link>
            </li>
            <li>
              <Link href="/#products" className="hover:text-[#38BDF8] transition">Shop Collection</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[#38BDF8] transition">Our Story (About)</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#38BDF8] transition">Contact Support</Link>
            </li>
            <li>
              <Link href="/my-orders" className="hover:text-[#38BDF8] transition">My Orders</Link>
            </li>
          </ul>
        </div>

        {/* Policies Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Company Rules</h4>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>
              <Link href="/shipping-policy" className="hover:text-[#38BDF8] transition">Shipping & Delivery</Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-[#38BDF8] transition">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-[#38BDF8] transition">Return & Refund Policy</Link>
            </li>
          </ul>
        </div>

        {/* Corporate Address & Registry Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Corporate Registry</h4>
          <div className="text-sm text-neutral-400 space-y-2 leading-relaxed">
            <p>
              <span className="block font-semibold text-white">JS Faisal Dresses</span>
              Owner: Shaban Azim
            </p>
            <p className="text-xs text-neutral-500">
              Q-283, Mudialy Road<br />
              PO Garden Reach, PS Metiabruz<br />
              Kolkata, West Bengal 700024
            </p>
            <p className="text-xs font-semibold text-white">
              GSTIN: 19AJMPA3270H1Z9
            </p>
            <p className="text-xs font-semibold text-white">
              Phone: +91 7003951437
            </p>
          </div>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="max-w-6xl mx-auto border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 gap-4">
        <div>
          © Denim Dynasty Studio. All Rights Reserved.
        </div>
        <div className="flex gap-6 font-semibold flex-wrap justify-center md:justify-end">
          <a href="https://wa.me/917003951437" target="_blank" rel="noopener noreferrer" className="text-[#38BDF8] hover:opacity-80 transition flex items-center gap-1">
            💬 Connect on WhatsApp
          </a>
          <a href="https://www.instagram.com/denimdynastystudio?utm_source=qr&igsh=dWZiYTZqNjF4ODNm" target="_blank" rel="noopener noreferrer" className="text-[#E1306C] hover:opacity-80 transition flex items-center gap-1">
            📸 Follow on Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
