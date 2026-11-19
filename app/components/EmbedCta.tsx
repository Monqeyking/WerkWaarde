import Link from "next/link";

/** Small line under a calculator that points site owners to the embed code. */
export default function EmbedCta({ className = "shell" }: { className?: string }) {
  return <p className={`embed-cta ${className}`}>
    <span>Schrijf je over salaris of werk?</span> <Link href="/insluiten">Zet deze calculator gratis op je eigen site →</Link>
  </p>;
}
