type Props = {
  name: string;
  tint: [string, string];
  screenshot?: { src: string; alt: string };
  className?: string;
};

/** A phone outline holding a screenshot, or tinted placeholder art until one exists. */
export function PhoneFrame({ name, tint, screenshot, className = "" }: Props) {
  return (
    <div
      className={`relative aspect-[9/19] overflow-hidden rounded-[2rem] border-[6px] border-[#05070a] bg-[#05070a] shadow-2xl shadow-black/40 ${className}`}
    >
      {screenshot ? (
        <img
          src={screenshot.src}
          alt={screenshot.alt}
          loading="lazy"
          className="h-full w-full rounded-[1.6rem] object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full flex-col justify-between rounded-[1.6rem] p-4"
          style={{ background: `linear-gradient(160deg, ${tint[0]}, ${tint[1]} 75%)` }}
        >
          <span className="mx-auto h-1.5 w-12 rounded-full bg-black/40" />
          <span className="font-display text-lg font-semibold leading-tight text-white">{name}</span>
        </div>
      )}
    </div>
  );
}
