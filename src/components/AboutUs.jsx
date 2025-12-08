import React from 'react';
import { Linkedin, Github } from 'lucide-react';

export default function AboutUs() {
  // Team members
  const teamMembers = [
    { name: 'Bhaskara', linkedin: 'https://www.linkedin.com/in/bhaskara-88aa76322/', github: 'https://github.com/bhaskara05' },
    { name: 'Khushal L', linkedin: 'https://linkedin.com/khushal-l', github: 'https://github.com/Khushal1513' },
    { name: 'Veekshitha K', linkedin: 'https://www.linkedin.com/in/veekshitha-k-2145-dbrv-/', github: 'https://github.com/Veekshitha21' },
    { name: 'Shri Chandana S Y', linkedin: 'https://www.linkedin.com/in/shrichandanasy', github: 'https://github.com/Shri2320' },
    { name: 'Manasa H N', linkedin: 'https://www.linkedin.com/in/manasa-h-n-0383bb331/', github: 'https://github.com/Manasa32264' },
    { name: 'Prasad A M', linkedin: 'https://www.linkedin.com/in/amprasad18', github: 'https://github.com/am-prasad' },
    { name: 'Nithin G', linkedin: 'https://www.linkedin.com/in/nithing17', github: 'https://github.com/17nithinnayak' },
    { name: 'Sthuthi Sheela', linkedin: 'https://www.linkedin.com/in/sthuthi-sheela-80571530b', github: 'https://github.com/Sthuthi1310' },
    { name: 'Dileep', linkedin: 'https://www.linkedin.com/in/dileep-shivakumar-b577982b2/', github: 'https://github.com/Dileep-S-S' }
  ];

  // Utilities
  const nameToSlug = (fullName) =>
    fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const sanitizeUrl = (url) => (url ? url.trim() : '#');
  const ensureHttps = (raw) => {
    const s = sanitizeUrl(raw);
    if (s === '#') return s;
    return /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/\//, '')}`;
  };
  const normalizeLinkedinUrl = (raw) => {
    try {
      const withProto = ensureHttps(raw);
      const u = new URL(withProto);
      if (u.hostname.includes('linkedin.com') && !u.pathname.startsWith('/in/')) {
        const cleanPath = u.pathname && u.pathname !== '/' ? u.pathname : '';
        u.pathname = `/in${cleanPath.startsWith('/') ? '' : '/'}${cleanPath.replace(/^\/+/, '')}`;
      }
      return u.toString();
    } catch {
      return ensureHttps(raw);
    }
  };

  return (
    <div className="min-h-screen custom-beige py-12 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-lg custom-brown opacity-90 max-w-3xl mx-auto leading-relaxed">
          AcadMate is your companion from doubts to degrees.
          <br />
          We connect students with tools, peers, and guidance to learn smarter every day.
        </p>
        <h1 className="mt-8 text-5xl font-extrabold custom-brown heading-glow">Meet Our Team</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          {teamMembers.map((member) => (
            <div key={member.name} className="relative group [perspective:1000px]">
              <div className="relative h-80 w-full rounded-2xl shadow-xl transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
                  <img
                    src={`/team/${nameToSlug(member.name)}.jpg`}
                    alt={member.name}
                    className="h-24 w-24 rounded-full object-cover shadow-md mb-4"
                    onError={(e) => {
                      const slug = nameToSlug(member.name);
                      const img = e.currentTarget;
                      if (!img.dataset.fallback) {
                        img.dataset.fallback = 'png';
                        img.src = `/team/${slug}.png`;
                      } else if (img.dataset.fallback === 'png') {
                        img.dataset.fallback = 'avatar';
                        img.src = `https://i.pravatar.cc/300?u=${encodeURIComponent(slug)}`;
                      }
                    }}
                  />
                  <h3 className="text-2xl font-bold custom-brown mb-2">{member.name}</h3>
                  <p className="text-sm custom-brown opacity-70">Team Member</p>
                </div>
                <div className="absolute inset-0 bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <h4 className="text-xl font-semibold custom-brown">Connect</h4>
                  <div className="flex items-center gap-6">
                    <a href={normalizeLinkedinUrl(member.linkedin)} target="_blank" rel="noreferrer" className="p-3 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-brown transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a href={ensureHttps(member.github)} target="_blank" rel="noreferrer" className="p-3 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-brown transition-colors">
                      <Github className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
