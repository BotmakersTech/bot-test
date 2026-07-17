import { useState } from "react";
import teamDefault from "../../assets/TeamDefault.png";

interface TeamLogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Team's logo URL, or null/undefined if none has been uploaded yet. */
  src?: string | null;
}

/**
 * Renders a team's logo, falling back to the shared TeamDefault.png artwork
 * whenever a team hasn't uploaded one (src is empty) or the URL fails to
 * load (a stale/broken CDN link). Use this instead of a raw <img> anywhere
 * a team logo is shown, so every such spot degrades the same way.
 */
export default function TeamLogo({ src, alt = "", ...rest }: TeamLogoProps) {
  const [broken, setBroken] = useState(false);
  // Reset the "broken" flag when src changes, without an effect — React's
  // documented pattern for adjusting state in response to a prop change.
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setBroken(false);
  }

  return (
    <img
      src={src && !broken ? src : teamDefault}
      alt={alt}
      onError={() => setBroken(true)}
      {...rest}
    />
  );
}
