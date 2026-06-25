// import {
//   useNavigate,
//   useParams,
// } from "react-router-dom";

// import { mockSports } from "../data/mockSports";

// export default function AdminSports() {

//   const navigate = useNavigate();

//   const { eventId } = useParams();

//   const sports = mockSports.filter(
//     (sport) => sport.eventId === eventId
//   );

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         padding: "32px",
//         background: "#2f2f2f",
//       }}
//     >

//       <h1
//         style={{
//           color: "white",
//           fontSize: "2.5rem",
//           fontWeight: 800,
//           marginBottom: "30px",
//         }}
//       >
//         Search Sports
//       </h1>

//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns:
//             "repeat(auto-fit,minmax(300px,1fr))",
//           gap: "24px",
//         }}
//       >

//         {sports.map((sport) => (

//           <div
//             key={sport.id}
//             onClick={() =>
//               navigate(`/admin/scores/${sport.id}`)
//             }
//             style={{
//               background:
//                 "linear-gradient(145deg,#171717,#101010)",
//               border:
//                 "1px solid rgba(255,255,255,0.06)",
//               borderRadius: "26px",
//               padding: "28px",
//               cursor: "pointer",
//             }}
//           >

//             <h2
//               style={{
//                 color: "white",
//                 marginBottom: "12px",
//               }}
//             >
//               {sport.name}
//             </h2>

//             <p style={{ color: "#9ca3af" }}>
//               {sport.category}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



