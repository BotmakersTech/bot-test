import { useNavigate } from "react-router-dom";
import trophyImg from "../../../assets/home/Img/spec/trophy.png";
import certificateImg from "../../../assets/home/Img/spec/cirtificate.png";
import repairImg from "../../../assets/home/Img/spec/repair.png";
import earthImg from "../../../assets/home/Img/spec/earth.png";

const FEATURES = [
  { img: trophyImg, title: "National Ranking", desc: "One National Leaderboard. Every Techfect Counts." },
  { img: certificateImg, title: "Verified Certificates", desc: "QR-Verified Achievements Recognized Across Affiliated Techfects." },
  { img: repairImg, title: "Ground Repair Tools", desc: "Repair, Rebuild, And Get Back In The Game." },
  { img: earthImg, title: "Gateway On Global", desc: "Qualify For Battle Of Robots And Represent India." },
];

export default function FeaturesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-[60px] bg-linear-to-r from-[#7b5cf6] to-[#8f6cf8]">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-9">
          {FEATURES.map(({ img, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-5 pt-6 text-center flex flex-col shadow-[0_14px_30px_rgba(20,10,60,.25)] [clip-path:polygon(19%_0,100%_0,100%_82%,88%_100%,0_100%,0_17%)]"
            >
              <div className="w-full h-[150px] md:h-[180px] mb-2.5 mx-auto">
                <img src={img} alt={title} className="w-full h-full object-contain" />
              </div>
              <h4 className="text-xl font-display font-semibold text-[#7b3ff2] mb-1.5">{title}</h4>
              <p className="text-[12px] text-[#000] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate("/register")}
            className="font-sans bg-white text-[#111] font-bold text-sm px-8 py-3 rounded-[10px] shadow-[0_10px_24px_rgba(0,0,0,.2)]"
          >
            Start Competing!
          </button>
        </div>
      </div>
    </section>
  );
}
