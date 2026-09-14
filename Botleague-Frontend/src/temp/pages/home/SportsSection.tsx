import roboWarImg from "../../../assets/sports/roboWar.png";
import roboSoccerImg from "../../../assets/sports/robo-soccer.jpeg";
import droneSoccer from "../../../assets/sports/drone-soccer.jpeg";
import roboRace from "../../../assets/sports/robo-race.png";
import lineFollower from "../../../assets/sports/line-follower.png";
import rcRacing from "../../../assets/sports/rc-racing.jpg";
import sumo from "../../../assets/sports/sobo-sumo.png";
const SPORTS = [
  { name: "Robo Sumo", image: sumo },
  { name: "Robo Race", image: roboRace },
  { name: "Robo Soccer", image: roboSoccerImg },
  { name: "Drone Soccer", image: droneSoccer },
  { name: "Line Follower", image: lineFollower },
  { name: "RoboWar", image: roboWarImg },
  { name: "RC Racing", image: rcRacing },
];

export default function SportsSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-[72px]">
      <div className="mx-auto max-w-[1450px] px-5 md:px-8">

        {/* Heading */}
        <div className="mb-10 text-center md:mb-12">
          <h2 className="font-[Orbitron] text-[26px] font-semibold leading-tight text-[#713cff] md:text-[36px]">
            7 tech sports. One standardized Rulebook.
          </h2>

          <p className="mt-3 text-sm text-[#515b73] md:text-[20px]">
            Same rules, same fairness, every city across India.
          </p>
        </div>

        {/* Sports */}
        <div className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {SPORTS.map((sport, index) => (
            <div
              key={sport.name}
              className={`
                relative mx-auto w-full max-w-[340px]
                ${index === 4 ? "lg:col-start-1 lg:ml-auto lg:translate-x-[52%]" : ""}
                ${index === 5 ? "lg:translate-x-[52%]" : ""}
                ${index === 6 ? "lg:translate-x-[52%]" : ""}
              `}
            >
              {/* Card */}
              <div
                className="
                  group relative overflow-hidden
                  border border-[#8050ff]
                  bg-white
                  shadow-[0_12px_30px_rgba(104,70,220,0.10)]
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-[0_18px_40px_rgba(104,70,220,0.18)]
                "
                style={{
                  clipPath:
                    "polygon(7% 0, 100% 0, 100% 88%, 92% 100%, 7% 100%, 0 92%, 0 8%)",
                }}
              >

                {/* Image */}
                <div
                  className="relative h-[250px] overflow-hidden bg-[#090b18] md:h-[285px]"
                  style={{
                    clipPath:
                      "polygon(8% 0, 100% 0, 100% 82%, 91% 100%, 0 100%, 0 9%)",
                  }}
                >
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="
                      h-full w-full object-cover
                      transition-transform duration-700
                      group-hover:scale-[1.04]
                    "
                  />

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />
                </div>

                {/* Label plate */}
                <div
                  className="
                    relative -mt-[1px]
                    flex h-[67px]
                    items-center justify-center
                    bg-white
                  "
                  style={{
                    clipPath:
                      "polygon(7% 0, 94% 0, 100% 18%, 100% 82%, 93% 100%, 7% 100%, 0 82%, 0 18%)",
                  }}
                >
                  <div className="text-center">
                    <h3 className="font-display text-[17px] font-semibold text-[#17203b] md:text-[19px]">
                      {sport.name}
                    </h3>

                    <div className="mx-auto mt-2 h-[3px] w-[48px] rounded-full bg-[#8047ff]" />
                  </div>
                </div>

                {/* Bottom-right decoration */}
                <div className="absolute -bottom-[2px] right-[7px] z-20 flex gap-[3px]">
                  <span className="h-[4px] w-[15px] -skew-x-[45deg] rounded-full bg-[#8050ff]" />
                  <span className="h-[4px] w-[10px] -skew-x-[45deg] rounded-full bg-[#9c73ff]" />
                  <span className="h-[4px] w-[5px] -skew-x-[45deg] rounded-full bg-[#c0aaff]" />
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}