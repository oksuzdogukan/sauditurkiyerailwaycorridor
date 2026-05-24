import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl mt-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-slate-900/90 z-10"></div>

        {/* Placeholder for a background image if you want to add one later */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=2000')] bg-cover bg-center opacity-40"></div>

        <div className="relative z-20 px-8 py-20 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
          <span className="text-blue-400 font-semibold tracking-wider uppercase text-sm mb-4">
            The Future of Transcontinental Travel
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Seamless Journeys Across <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Saudi Arabia & Türkiye
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl">
            Experience ultra high-speed, luxurious, and eco-friendly railway
            transit connecting the heart of the Middle East to the crossroads of
            Europe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/passenger"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1"
            >
              Book Your Journey
            </Link>
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 font-semibold px-8 py-4 rounded-lg shadow-lg transition-all"
            >
              Passenger Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            High-Speed Transit
          </h3>
          <p className="text-slate-600">
            Cutting-edge magnetic levitation and high-speed rail technology
            cutting travel times by up to 60% across borders.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            Seamless Borders
          </h3>
          <p className="text-slate-600">
            Integrated customs and rapid security checkpoints ensure your
            cross-country travel is completely frictionless.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">
            First-Class Luxury
          </h3>
          <p className="text-slate-600">
            Spacious seating, fine dining, and private sleeper cabins designed
            for ultimate comfort on long-haul routes.
          </p>
        </div>
      </section>
    </div>
  );
}
