import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-16">
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div className="space-y-6">
            <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-secondary">AeroLux</span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Precision engineering meets unparalleled luxury. Redefining the standard of global aviation since 2004.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div className="space-y-4">
              <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Company</span>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    Career
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    Investors
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Support</span>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    PWA Install
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-widest">Legal</span>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-outline-variant/10">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            © 2024 AeroLux Airlines. Precision in Every Mile.
          </span>
          <div className="flex gap-6">
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              <Image
                width={20}
                height={20}
                alt="X"
                className="opacity-70"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoQb9JJu7aacV2TA8gkVdcF3NF-czkGrwJz-lZjl7ntSdH5-rCfwH2qj-DC9PGWnyn-1m5hcIWKo3M9fwEPj-Yg-WljtDfdbMZsCI_PFfccog1Y0kb4KQ_IDtZcgmozW4dyO78iM4VIgkWmCFzCQI1ymDmfJ_wGMc327KRiQHZmrMxAp2J_mGZzAtGvNgK7nBt3ajqHTKzSult7S5HVd7sWfvEoLHy0CBfM4TNjiyQTWLdbD7t7oZG8t5PoApxYqCvmDE3WbNHjLc"
              />
            </Link>
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              <Image
                width={20}
                height={20}
                alt="LinkedIn"
                className="opacity-70"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsrVOH4C1NXgaTqMV2PrzPak416CYHtnaQh5dytk9KE_faP9k9CzonP2ahM-Gt4_KfUTR29S_NYFuVg4CuucOyu__5pQjkyeSR1UBco0EY3v6Ct73NEMgH5hTa3d1SsK92W4nuBKbA7wzdtQIOTQk9_7DVOmxbeaVTrsTL3R0qLEbjQCaiD0EiZ6VY6R1Sgh2KWkuOSwY15lJ-wTAD24_TP1ypQDVIZQGNjcliIeuoV2iNjch-T7fmwNDLfGGEFdSqt6GcLTY3Hk8"
              />
            </Link>
            <Link href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
              <Image
                width={20}
                height={20}
                alt="Instagram"
                className="opacity-70"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDtWTTFt0wBMxESCjo_Kc91Vb0zikdh8DeRRTQH5O7Jlk8uQwSRukVCZ9DM1kqnstnJ4K-vOcXo2MUuRIgzqJrLdy4UU6006AnL8tM8K57k-GG2xTB58nVuo4ycFCElUY9mfMwG8QpKURM5qTfxlArrn3hoMQsa2QEQBkk1RS1ASISLzTDZvDoiB9n4N_D5ljJ69pRP9J5o3CopfQfdHbYLaZowZSz1E_lwiIxAa9ymnQxWs1wORjJtriqgCRtFS3zJrwSz9mpa98"
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
