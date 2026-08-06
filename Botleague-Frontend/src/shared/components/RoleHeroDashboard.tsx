import { useEffect, useRef, useState } from "react";
import "../../styles/roleHeroDashboard.css";

// Design was built at this fixed size in Figma. We scale the whole canvas
// down/up to fit the available width instead of letting it overflow with
// a scrollbar. Ported 1:1 from the supplied JudgeDashboard.jsx/css.
const DESIGN_WIDTH = 1513;
const DESIGN_HEIGHT = 1010;

// The Figma source reserved this band at the top/left for a navbar+sidenav
// that don't exist here (the app's own Layout renders that chrome instead —
// same reason the source JSX had them commented out). Left in, that band
// renders as dead white space. Every element keeps its original coordinate;
// we just crop the visible canvas to start past this band instead of
// re-deriving 30+ positions.
const CROP_LEFT = 170;
const CROP_TOP = 60;
const VISIBLE_WIDTH = DESIGN_WIDTH - CROP_LEFT;
const VISIBLE_HEIGHT = DESIGN_HEIGHT - CROP_TOP;

// Same asset map as the source file, unchanged — these are the exact URLs
// supplied. (Note: they're Figma MCP session-scoped proxy links, so they
// may not resolve outside that session/for anonymous site visitors — see
// note at the end of this turn. Left exactly as given, not substituted.)
const img = {
  property1Default: "https://www.figma.com/api/mcp/asset/598ae357-8c4c-4328-b898-7f4927c837e2.svg",
  image125: "https://www.figma.com/api/mcp/asset/e1c990ff-67b2-4f18-9af7-50a25b6e841c.png",
  rectangle4631: "https://www.figma.com/api/mcp/asset/0a8f5a2b-c79c-45d0-ab00-bcdffe528831.png",
  judgeHero: "https://www.figma.com/api/mcp/asset/e8c5732a-da26-443a-be45-29af851cad38.png",
  achievementBadges: "https://www.figma.com/api/mcp/asset/237d8e13-c5be-4ac5-baeb-377ae0578848.png",
  star25: "https://www.figma.com/api/mcp/asset/14bbc249-cb9e-41e6-acad-dee7aeff1852.svg",
  star24: "https://www.figma.com/api/mcp/asset/26d3face-64fb-4249-871d-ad9b74160b04.svg",
  vector277: "https://www.figma.com/api/mcp/asset/662ed3c8-8744-4222-b35c-2bc23d336fd4.svg",
  vector276: "https://www.figma.com/api/mcp/asset/d118befd-b46e-4896-a091-9c8cc1d53c85.svg",
  ellipse19: "https://www.figma.com/api/mcp/asset/1ea7b45e-03dc-47af-8997-9f5a7f1965f7.svg",
  vectorShare: "https://www.figma.com/api/mcp/asset/8eba56cb-893e-4191-a58d-b0cd119aeef6.svg",
  vectorEdit: "https://www.figma.com/api/mcp/asset/f0579855-a41f-4f45-9694-a1c934a7a96f.svg",
  star20: "https://www.figma.com/api/mcp/asset/4871b945-83b3-4e46-b719-d0f349bddb52.svg",
  star21: "https://www.figma.com/api/mcp/asset/404b1310-8281-4fff-8df7-0be5e3764fd9.svg",
  star22: "https://www.figma.com/api/mcp/asset/9b3fc074-2b5f-4445-ae52-279638dd3a5e.svg",
  group1000003824: "https://www.figma.com/api/mcp/asset/92ddfb0d-7f1c-4964-9e0d-179e7271b45a.svg",
  eosRoleBinding: "https://www.figma.com/api/mcp/asset/fa7f135a-3bfd-4d58-ae3e-1196c0c3d07f.svg",
  group: "https://www.figma.com/api/mcp/asset/380bd249-3120-4644-95db-0ac8ebbb8240.svg",
  group1: "https://www.figma.com/api/mcp/asset/d4bdfb79-4aa2-4131-a618-1320a6d1d63a.svg",
  group2: "https://www.figma.com/api/mcp/asset/53cfbd35-7623-4234-9423-c5691335e049.svg",
  group3: "https://www.figma.com/api/mcp/asset/8d07df26-7d58-44b6-b680-bd458bbe2149.svg",
  group4: "https://www.figma.com/api/mcp/asset/e82ad665-af83-4d13-a34f-49fdfdc8f923.svg",
  group5: "https://www.figma.com/api/mcp/asset/f27dfa49-2e5f-4fc7-83c6-c3bd29687f23.svg",
  group6: "https://www.figma.com/api/mcp/asset/5bf9d6b8-a5ec-4982-8c10-f25bdbd0cd00.svg",
  tablerSwords: "https://www.figma.com/api/mcp/asset/9a843bc4-7e00-40f2-b12e-3c34e6207b3d.svg",
  star23: "https://www.figma.com/api/mcp/asset/c6999832-8bea-4cea-8d95-67d7dd46dc87.svg",
  tablerSwords1: "https://www.figma.com/api/mcp/asset/3d031b95-01ba-4f11-9489-411ed7134ab6.svg",
  group7: "https://www.figma.com/api/mcp/asset/45653319-c76a-4bb1-986f-999ca78a5fdd.svg",
  f7Placemark: "https://www.figma.com/api/mcp/asset/0717f68b-633f-4d58-8274-9b896cc2f3fe.svg",
  mdiArenaOutline: "https://www.figma.com/api/mcp/asset/d55cbd38-d133-4693-9c51-b29305922b92.svg",
  ellipse596: "https://www.figma.com/api/mcp/asset/16a3489c-6423-49e8-969b-4a949703095e.svg",
  ellipse597: "https://www.figma.com/api/mcp/asset/cdb02f3b-64e1-44e9-99f8-35942ab6e53b.svg",
};

/** One of the three repeating background bars behind the stat numbers. */
function StatBackdrop({ top }: { top: number }) {
  return (
    <div className="rhd-abs" style={{ left: 779, top, width: 345, height: 55 }}>
      <img alt="" className="rhd-fill-img" src={img.property1Default} />
    </div>
  );
}

/**
 * "Experience" stat icon — a 6-layer bar-chart glyph in the Figma source
 * (node 6030:14234). All insets below are percentages against the profile
 * card (1175x343), matching Figma's exported layout exactly.
 */
function ExperienceIcon() {
  return (
    <div style={{ display: "contents" }} data-name="Experience Icon">
      <div className="rhd-abs" style={{ inset: "79.54% 25.7% 19.83% 71.32%" }}>
        <div className="rhd-abs" style={{ inset: "-22.85% -1.43% -22.86% -1.43%" }}>
          <img alt="" className="rhd-fill-img" src={img.group1} />
        </div>
      </div>
      <div className="rhd-abs" style={{ inset: "73.48% 27.78% 21.1% 71.34%" }}>
        <div className="rhd-abs" style={{ inset: "-2.69% -4.81%" }}>
          <img alt="" className="rhd-fill-img" src={img.group2} />
        </div>
      </div>
      <div className="rhd-abs" style={{ inset: "71.72% 26.71% 21.1% 72.41%" }}>
        <div className="rhd-abs" style={{ inset: "-2.03% -4.81%" }}>
          <img alt="" className="rhd-fill-img" src={img.group3} />
        </div>
      </div>
      <div style={{ display: "contents" }}>
        <div className="rhd-abs" style={{ inset: "70.93% 26.03% 27.64% 73.71%" }}>
          <div className="rhd-abs" style={{ inset: "-10.16% -16.27%" }}>
            <img alt="" className="rhd-fill-img" src={img.group4} />
          </div>
        </div>
        <div className="rhd-abs" style={{ inset: "72.39% 26.21% 27.29% 73.69%" }}>
          <div className="rhd-abs" style={{ inset: "-45.92% -45.71% -45.9% -45.71%" }}>
            <img alt="" className="rhd-fill-img" src={img.group5} />
          </div>
        </div>
        <div className="rhd-abs" style={{ inset: "69.97% 25.68% 21.1% 73.43%" }}>
          <div className="rhd-abs" style={{ inset: "-1.63% -4.81%" }}>
            <img alt="" className="rhd-fill-img" src={img.group6} />
          </div>
        </div>
      </div>
    </div>
  );
}

export interface RoleHeroDashboardProps {
  welcomeName: string;
  name: string;
  photoUrl?: string | null;
  idLabel: string;
  idValue: string;
  roleLabel: string;
  onShare?: () => void;
  onEdit?: () => void;
  stat1Value: string | number;
  stat1Label: string;
  stat2Value: string | number;
  stat2Label: string;
  stat3Value: string | number;
  stat3Label: string;
  eventTitle: string;
  eventTag: string;
  eventArena?: string;
  eventTime?: string;
  eventPlace?: string;
  eventImageUrl?: string | null;
  onViewEvent?: () => void;
  achievement1Label: string;
  achievement2Label: string;
}

export default function RoleHeroDashboard({
  welcomeName,
  name,
  photoUrl,
  idLabel,
  idValue,
  roleLabel,
  onShare,
  onEdit,
  stat1Value,
  stat1Label,
  stat2Value,
  stat2Label,
  stat3Value,
  stat3Label,
  eventTitle,
  eventTag,
  eventArena,
  eventTime,
  eventPlace,
  eventImageUrl,
  onViewEvent,
  achievement1Label,
  achievement2Label,
}: RoleHeroDashboardProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = outerRef.current;
    if (!node) return;

    const updateScale = () => {
      const containerWidth = node.offsetWidth;
      if (containerWidth > 0) {
        setScale(containerWidth / VISIBLE_WIDTH);
      }
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rhd-canvas-outer" ref={outerRef} style={{ height: VISIBLE_HEIGHT * scale }}>
      <div
        className="rhd-canvas"
        data-name="Role Hero Dashboard"
        style={{ transform: `scale(${scale}) translate(-${CROP_LEFT}px, -${CROP_TOP}px)` }}
      >
        {/* ---------- decorative stars & background vectors ---------- */}
        <div className="rhd-abs" style={{ left: 854, top: 791, width: 171, height: 202.971 }}>
          <div className="rhd-star-rot-a">
            <img alt="" className="rhd-fill-img" src={img.star25} />
          </div>
        </div>
        <div className="rhd-abs" style={{ left: 135, top: 877, width: 58.694, height: 71.31 }}>
          <div className="rhd-star-rot-b">
            <img alt="" className="rhd-fill-img" src={img.star24} />
          </div>
        </div>
        <div className="rhd-abs" style={{ left: 0, top: 760, width: 1513, height: 256 }}>
          <img alt="" className="rhd-fill-img" src={img.vector277} />
        </div>
        <div className="rhd-abs rhd-fade" style={{ left: 33, top: 442, width: 318.396, height: 279.223 }}>
          <div style={{ transform: "rotate(30.36deg)" }}>
            <img alt="" src={img.image125} style={{ width: 273, opacity: 0.11 }} />
          </div>
        </div>
        <div className="rhd-abs rhd-fade" style={{ left: 1295, top: 655, width: 243.014, height: 222.13 }}>
          <div style={{ transform: "rotate(-22.71deg)" }}>
            <img alt="" src={img.image125} style={{ width: 197, opacity: 0.11 }} />
          </div>
        </div>
        <div className="rhd-abs" style={{ left: 98, top: 82, width: 1412, height: 372 }}>
          <img alt="" className="rhd-fill-img" src={img.vector276} />
        </div>

        {/* ---------- heading ---------- */}
        <p className="rhd-abs rhd-welcome" style={{ left: 220, top: 135, width: 602 }}>
          Welcome back, {welcomeName}!
        </p>

        {/* ---------- header profile card ---------- */}
        <div className="rhd-abs rhd-profile-card" style={{ left: 224, top: 214, width: 1175, height: 343 }}>
          <div className="rhd-hdivider" />

          <div className="rhd-abs rhd-name-row" style={{ left: 46, top: 87, width: 560 }}>
            <p className="rhd-name">{name}</p>
            <div className="rhd-active-badge">
              <img alt="" className="rhd-active-dot" src={img.ellipse19} />
              <span>Active</span>
            </div>
          </div>

          {onShare && (
            <button type="button" className="rhd-abs rhd-btn-gradient" style={{ left: 52, top: 256, width: 114, height: 32 }} onClick={onShare}>
              <img alt="" src={img.vectorShare} style={{ width: 11, height: 12 }} />
              <span>Share</span>
            </button>
          )}

          {onEdit && (
            <button type="button" className="rhd-abs rhd-btn-gradient" style={{ left: 176, top: 256, width: 114, height: 32 }} onClick={onEdit}>
              <img alt="" src={img.vectorEdit} style={{ width: 12, height: 12 }} />
              <span>Edit</span>
            </button>
          )}

          <p className="rhd-abs rhd-id-text" style={{ left: 46, top: 136, width: 400 }}>
            {idLabel} - {idValue}
          </p>
          <p className="rhd-abs rhd-role-text" style={{ left: 74, top: 176, width: 300 }}>
            {roleLabel}
          </p>
          <div className="rhd-abs" style={{ left: 46, top: 176, width: 23, height: 23 }}>
            <img alt="" className="rhd-fill-img" src={img.eosRoleBinding} />
          </div>

          <StatBackdrop top={57} />
          <StatBackdrop top={143} />
          <StatBackdrop top={229} />

          <p className="rhd-abs rhd-stat-num" style={{ left: "calc(50% + 308.5px)", top: 60 }}>
            {stat1Value}
          </p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 370.5px)", top: 77, width: 80 }}>
            {stat1Label}
          </p>

          <p
            className="rhd-abs rhd-stat-num"
            style={{ left: "calc(50% + 329px)", top: 143, width: 51, textAlign: "center", transform: "translateX(-50%)" }}
          >
            {stat2Value}
          </p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 365.5px)", top: 160, width: 115 }}>
            {stat2Label}
          </p>

          <p
            className="rhd-abs rhd-stat-num"
            style={{ left: "calc(50% + 328.5px)", top: 233, width: 50, textAlign: "center", transform: "translateX(-50%)" }}
          >
            {stat3Value}
          </p>
          <p className="rhd-abs rhd-stat-label" style={{ left: "calc(50% + 365.5px)", top: 250, width: 115 }}>
            {stat3Label}
          </p>

          {/* stat icons: scale (stat1), swords (stat2), bar-chart (stat3) */}
          <div className="rhd-abs" style={{ left: 837, top: 60, width: 38, height: 32 }}>
            <img alt="" className="rhd-fill-img" src={img.group} />
          </div>
          <div className="rhd-abs" style={{ left: 837, top: 152, width: 36, height: 36 }}>
            <img alt="" className="rhd-fill-img" src={img.tablerSwords} />
          </div>
          <ExperienceIcon />

          {/* decorative stars inside the card */}
          <div className="rhd-abs rhd-star-rot-c" style={{ left: -27, top: 161, width: 116.874, height: 116.874 }}>
            <img alt="" className="rhd-fill-img" src={img.star20} />
          </div>
          <div className="rhd-abs rhd-star-rot-c" style={{ left: 1084, top: -36, width: 116.874, height: 116.874 }}>
            <img alt="" className="rhd-fill-img" src={img.star20} />
          </div>
          <div className="rhd-abs rhd-star-rot-d" style={{ left: 370, top: -31, width: 106.668, height: 106.668 }}>
            <img alt="" className="rhd-fill-img" src={img.star21} />
          </div>
          <div className="rhd-abs rhd-star-rot-e" style={{ left: 997.08, top: 285.08, width: 92.516, height: 92.516 }}>
            <img alt="" className="rhd-fill-img" src={img.star22} />
          </div>

          <div className="rhd-abs rhd-fade-soft" style={{ left: 376, top: -3, width: 402.232, height: 344 }}>
            <img alt="" className="rhd-fill-img" src={img.group1000003824} />
          </div>
        </div>

        {/* far-right gradient chip near top of card */}
        <div className="rhd-abs rhd-gradient-fill" style={{ left: 1261, top: 138, width: 133, height: 40, borderRadius: 6 }} />

        <div className="rhd-abs rhd-star-rot-f" style={{ left: 871, top: 565, width: 53, height: 55.102 }}>
          <img alt="" className="rhd-fill-img" src={img.star23} />
        </div>
        <div className="rhd-abs rhd-star-rot-d" style={{ left: 1252, top: 680, width: 106.668, height: 106.668 }}>
          <img alt="" className="rhd-fill-img" src={img.star21} />
        </div>

        {/* hero photo — real photo when available, falling back to the
            supplied placeholder art, cropped/zoomed exactly as designed */}
        <div className="rhd-abs" style={{ left: 635, top: 122, width: 338, height: 435, overflow: "hidden", pointerEvents: "none" }}>
          <img
            alt={name}
            style={{
              position: "absolute",
              maxWidth: "none",
              height: "212.35%",
              width: "410.18%",
              left: "-113.33%",
              top: "-0.05%",
            }}
            src={photoUrl || img.judgeHero}
          />
        </div>

        {/* ---------- previous events card ---------- */}
        <div className="rhd-abs rhd-outline-card" style={{ left: 225, top: 571, width: 686, height: 332 }}>
          <p className="rhd-abs rhd-section-title" style={{ left: 26, top: 17, width: 238 }}>
            Previous Events
          </p>

          <div className="rhd-abs rhd-event-placeholder" style={{ left: 26, top: 67, width: 279, height: 43 }} />
          <div className="rhd-abs rhd-event-placeholder" style={{ left: 26, top: 122, width: 279, height: 43 }} />

          <div className="rhd-abs rhd-vdivider-v" style={{ left: 342, top: 12, height: 305 }} />

          <div
            className="rhd-abs"
            style={{ left: 357, top: 17, width: 311, height: 132, borderRadius: 12, overflow: "hidden", background: "#d9d9d9" }}
          >
            <img alt={eventTitle} className="rhd-fill-img" style={{ objectFit: "cover" }} src={eventImageUrl || img.rectangle4631} />
          </div>

          <p className="rhd-abs rhd-event-title" style={{ left: 370, top: 157, width: 131 }}>
            {eventTitle}
          </p>
          <p className="rhd-abs rhd-event-upcoming" style={{ left: 565, top: 165, width: 102 }}>
            {eventTag}
          </p>

          {onViewEvent && (
            <button type="button" className="rhd-abs rhd-btn-gradient rhd-btn-sm" style={{ left: 569, top: 292, width: 94, height: 25 }} onClick={onViewEvent}>
              <span>View Details</span>
            </button>
          )}

          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 195 }}>Match : </p>
          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 222 }}>Arena :</p>
          <p className="rhd-abs rhd-meta-value" style={{ left: 454, top: 222 }}>{eventArena}</p>
          <p className="rhd-abs rhd-meta-value" style={{ left: 454, top: 249 }}>{eventTime}</p>
          <p className="rhd-abs rhd-meta-value" style={{ left: 454, top: 276 }}>{eventPlace}</p>
          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 249 }}>Time : </p>
          <p className="rhd-abs rhd-meta-label" style={{ left: 396, top: 276 }}>Place :</p>

          <div className="rhd-abs" style={{ left: 371, top: 194, width: 17, height: 17 }}>
            <img alt="" className="rhd-fill-img" src={img.tablerSwords1} />
          </div>
          <div className="rhd-abs" style={{ left: 371, top: 248, width: 17, height: 17 }}>
            <img alt="" className="rhd-fill-img" src={img.group7} />
          </div>
          <div className="rhd-abs" style={{ left: 371, top: 276, width: 18, height: 18 }}>
            <img alt="" className="rhd-fill-img" src={img.f7Placemark} />
          </div>
          <div className="rhd-abs" style={{ left: 370, top: 220, width: 19, height: 19 }}>
            <img alt="" className="rhd-fill-img" src={img.mdiArenaOutline} />
          </div>
        </div>

        {/* ---------- achievements card ---------- */}
        <div className="rhd-abs rhd-outline-card" style={{ left: 933, top: 571, width: 463, height: 332 }}>
          <p className="rhd-abs rhd-section-title" style={{ left: 35, top: 19, width: 238 }}>
            Achievements
          </p>
          <div className="rhd-abs rhd-vdivider-h" style={{ left: 35, top: 54, width: 400 }} />

          <div className="rhd-abs rhd-achievement" style={{ left: 35, top: 72, width: 154, height: 189 }}>
            <div style={{ position: "absolute", left: 7, top: 2, width: 140, height: 170 }}>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                <img
                  alt={achievement1Label}
                  style={{
                    position: "absolute",
                    maxWidth: "none",
                    height: "128.48%",
                    width: "369.22%",
                    left: "-10.67%",
                    top: "-3.97%",
                  }}
                  src={img.achievementBadges}
                />
              </div>
            </div>
            <p className="rhd-abs rhd-achievement-label" style={{ left: 30, top: 166, width: 94 }}>
              {achievement1Label}
            </p>
          </div>
          <div className="rhd-abs rhd-achievement" style={{ left: 211, top: 72, width: 154, height: 189 }}>
            <div style={{ position: "absolute", left: 15, top: 11, width: 123, height: 155 }}>
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                <img
                  alt={achievement2Label}
                  style={{
                    position: "absolute",
                    maxWidth: "none",
                    height: "131.15%",
                    width: "389.65%",
                    left: "-145.24%",
                    top: "-3.93%",
                  }}
                  src={img.achievementBadges}
                />
              </div>
            </div>
            <p
              className="rhd-abs rhd-achievement-label"
              style={{ left: "50%", top: 166, width: 55, textAlign: "center", transform: "translateX(-50%)" }}
            >
              {achievement2Label}
            </p>
          </div>

          <div className="rhd-abs" style={{ left: "calc(50% + 0.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }}>
            <img alt="" className="rhd-fill-img" src={img.ellipse596} />
          </div>
          <div className="rhd-abs" style={{ left: "calc(50% - 19.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }}>
            <img alt="" className="rhd-fill-img" src={img.ellipse597} />
          </div>
          <div className="rhd-abs" style={{ left: "calc(50% + 20.5px)", top: 299, width: 12, height: 12, transform: "translateX(-50%)" }}>
            <img alt="" className="rhd-fill-img" src={img.ellipse596} />
          </div>
        </div>

        <div className="rhd-abs rhd-vdivider-h" style={{ left: 241, top: 624, width: 308 }} />
      </div>
    </div>
  );
}
