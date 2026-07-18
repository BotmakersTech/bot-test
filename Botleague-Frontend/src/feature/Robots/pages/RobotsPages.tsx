import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";

import { useAppSelector } from "../../../app/hooks";
import Modal from "../../../shared/components/Modal";
import useTeamMembership from "../../Team/TeamMembership/hooks/useTeamMembership";
import CreateRobotForm from "../components/CreateRobotFrom";
import TeamBuildEmptyState from "../components/TeamBuildEmptyState";
import useRobots from "../hooks/useRobots";
import type { Robot } from "../types/types";
import robotFallback from "../../../assets/robot.png";
import robotEmptyState from "../../../assets/robot-empty-state.png";
import mascotRobot from "../../../assets/mascote.png";
import flightDecoration from "../../../assets/Auth/flight.svg";
import starDecoration from "../../../assets/Auth/Star-18.svg";
import "../../../styles/robots.css";

type FilterKey = "ALL" | "ACTIVE" | "INACTIVE";

const heroFallbacks = [
  robotFallback,
  mascotRobot,
  "/icons/Hero-Bot.png",
  robotEmptyState,
  "/icons/robo.png",
];

function toLabel(value?: string | null) {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getRobotImage(robot?: Robot) {
  return robot?.robotIMG || heroFallbacks[0];
}

function getWeight(robot: Robot) {
  if (robot.weightKg != null) return `${robot.weightKg} Kg`;
  if (robot.weightClass) return toLabel(robot.weightClass);
  return "-";
}

function isInactive(status?: string) {
  return status !== "ACTIVE";
}

function carouselSlots(images: string[], activeIndex: number) {
  const count = images.length;
  if (count === 0) return [];

  return [-2, -1, 0, 1, 2].map((offset) => {
    const index = (activeIndex + offset + count) % count;
    return {
      src: images[index],
      key: `${index}-${offset}`,
      offset,
    };
  });
}

export default function RobotsPage() {
  const navigate = useNavigate();
  const teamCode = useAppSelector((state) => state.team.teamCode);
  const { robots, loading, error, fetchRobots } = useRobots(teamCode ?? undefined);
  const { isAdmin: canManageRobots } = useTeamMembership(teamCode ?? "");

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [activeHero, setActiveHero] = useState(0);

  const heroImages = useMemo(() => {
    const uploaded = robots.map(robot => robot.robotIMG).filter(Boolean) as string[];
    const unique = Array.from(new Set([...uploaded, ...heroFallbacks]));
    return unique.length > 0 ? unique : heroFallbacks;
  }, [robots]);

  const visibleRobots = useMemo(() => {
    if (filter === "ALL") return robots;
    if (filter === "ACTIVE") return robots.filter(robot => robot.status === "ACTIVE");
    return robots.filter(robot => isInactive(robot.status));
  }, [filter, robots]);

  const changeHero = (direction: number) => {
    setActiveHero(current => (current + direction + heroImages.length) % heroImages.length);
  };

  const openCreate = () => {
    if (canManageRobots) setShowCreate(true);
  };

  const onCreateSuccess = () => {
    fetchRobots();
    setShowCreate(false);
  };

  if (loading) {
    return (
      <div className="robot-build-page robot-build-state">
        <div className="robot-build-spinner" />
        <p>Loading robots...</p>
      </div>
    );
  }

  if (!teamCode) {
    return (
      <div className="robot-build-page robot-build-state">
        <h1>Team Build</h1>
        <p>Create or join a team before adding robots.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="robot-build-page robot-build-state">
        <h1>Team Build</h1>
        <p>{error}</p>
        <button type="button" className="robot-build-secondary" onClick={fetchRobots}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="robot-build-page robot-create-page">
        <img className="robot-build-bg robot-build-bg-flight-left" src={flightDecoration} alt="" aria-hidden="true" />
        <img className="robot-build-bg robot-build-bg-flight-right" src={flightDecoration} alt="" aria-hidden="true" />
        <img className="robot-build-star robot-build-star-top" src={starDecoration} alt="" aria-hidden="true" />
        <img className="robot-build-star robot-build-star-mid" src={starDecoration} alt="" aria-hidden="true" />
        <img className="robot-build-star robot-build-star-bottom" src={starDecoration} alt="" aria-hidden="true" />
        <div className="robot-build-shell robot-create-shell">
          <CreateRobotForm onSuccess={onCreateSuccess} onCancel={() => setShowCreate(false)} />
        </div>
      </div>
    );
  }

  // First time on this team, or a captain who just created it — no robots
  // added yet. Shown instead of the (empty) carousel + filter tabs.
  if (robots.length === 0) {
    return (
      <div className="robot-build-page">
        <TeamBuildEmptyState canManageRobots={canManageRobots} onCreateClick={openCreate} />
      </div>
    );
  }

  return (
    <div className="robot-build-page">
      <img className="robot-build-bg robot-build-bg-flight-left" src={flightDecoration} alt="" aria-hidden="true" />
      <img className="robot-build-bg robot-build-bg-flight-right" src={flightDecoration} alt="" aria-hidden="true" />
      <img className="robot-build-star robot-build-star-top" src={starDecoration} alt="" aria-hidden="true" />
      <img className="robot-build-star robot-build-star-mid" src={starDecoration} alt="" aria-hidden="true" />
      <img className="robot-build-star robot-build-star-bottom" src={starDecoration} alt="" aria-hidden="true" />

      <div className="robot-build-shell">
        <header className="robot-build-header">
          <h1>Team Build</h1>
          {canManageRobots && (
            <button type="button" className="robot-build-add" onClick={() => setShowCreate(true)}>
              <Plus size={19} />
              Add Robot
            </button>
          )}
        </header>

        <section className="robot-hero" aria-label="Robot image carousel">
          <button type="button" className="robot-hero-arrow robot-hero-arrow-left" onClick={() => changeHero(-1)} aria-label="Previous robot image">
            <ChevronLeft size={56} strokeWidth={1.7} />
          </button>

          <div className="robot-hero-stage">
            {carouselSlots(heroImages, activeHero).map(item => (
              <img
                key={item.key}
                src={item.src}
                alt=""
                aria-hidden="true"
                className={`robot-hero-img robot-hero-img-${item.offset + 2}`}
                draggable={false}
              />
            ))}
          </div>

          <button type="button" className="robot-hero-arrow robot-hero-arrow-right" onClick={() => changeHero(1)} aria-label="Next robot image">
            <ChevronRight size={56} strokeWidth={1.7} />
          </button>
        </section>

        <section className="robot-list-zone" aria-label="Team robots">
          <div className="robot-filter-tabs" role="tablist" aria-label="Filter robots">
            {[
              { key: "ALL" as const, label: "All" },
              { key: "ACTIVE" as const, label: "Active" },
              { key: "INACTIVE" as const, label: "Inactive" },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`robot-filter-tab${filter === tab.key ? " active" : ""}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {visibleRobots.length === 0 ? (
            // robots.length is guaranteed > 0 here (the zero-robots case
            // early-returns TeamBuildEmptyState above) — this is only the
            // "current filter matches nothing" case.
            <div className="robot-empty-row">
              <img src={getRobotImage()} alt="" />
              <div>
                <h2>No robots found</h2>
                <p>Try another filter.</p>
              </div>
            </div>
          ) : (
            <div className="robot-rows">
              {visibleRobots.map(robot => {
                const active = robot.status === "ACTIVE";

                return (
                  <article className="robot-data-row" key={robot.id}>
                    <img className="robot-row-image" src={getRobotImage(robot)} alt={robot.robotName} />

                    <div className="robot-row-name">
                      <h2>{robot.robotName}</h2>
                      <span className={`robot-status-pill${active ? " active" : " inactive"}`}>
                        <span />
                        {active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="robot-row-field">
                      <span>BotID</span>
                      <strong>{robot.robotCode || "-"}</strong>
                    </div>

                    <div className="robot-row-field">
                      <span>Weight</span>
                      <strong>{getWeight(robot)}</strong>
                    </div>

                    <div className="robot-row-field">
                      <span>Sports</span>
                      <strong>{toLabel(robot.sport)}</strong>
                    </div>

                    <button type="button" className="robot-profile-link" onClick={() => navigate(`/robots/${robot.id}`)}>
                      View Profile
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <Modal title="Create Robot" onClose={() => setShowCreate(false)}>
          <CreateRobotForm onSuccess={onCreateSuccess} />
        </Modal>
      )}
    </div>
  );
}
